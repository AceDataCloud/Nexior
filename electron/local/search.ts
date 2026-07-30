import fsp from 'node:fs/promises';
import path from 'node:path';
import type { ToolResult } from './types';
import { assertInRoots, expandHome, listRoots } from './fs';

// Search tools (glob by name, grep by content) confined to the same authorized
// roots as the file tools. Without these the model can only crawl `list_dir`
// level by level, which costs a round-trip per directory.

// Directories that are never worth walking and would dominate every result set.
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.hg',
  '.svn',
  'dist',
  'build',
  'out',
  '.next',
  '.nuxt',
  '.venv',
  'venv',
  '__pycache__',
  '.pytest_cache',
  '.ruff_cache',
  '.mypy_cache',
  'target',
  'vendor',
  '.gradle',
  'Pods',
  '.terraform'
]);

const MAX_FILES_SCANNED = 20_000; // walk ceiling, so a huge tree can't hang the app
const MAX_GLOB_RESULTS = 500;
const MAX_GREP_MATCHES = 200;
const MAX_GREP_FILE_BYTES = 2_000_000; // skip anything bigger; not source code
const MAX_LINE_CHARS = 400; // one minified line shouldn't blow the model's context
const WALK_BUDGET_MS = 10_000;

/** Glob → RegExp. Every non-wildcard char is escaped, so a path containing
 *  regex metacharacters can never be reinterpreted as a pattern. */
function globToRegExp(glob: string, caseInsensitive: boolean): RegExp {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // `**/` spans any depth INCLUDING zero, so `**/*.ts` also matches a
        // top-level `a.ts`.
        if (glob[i + 2] === '/') {
          re += '(?:.*/)?';
          i += 2;
        } else {
          re += '.*';
          i += 1;
        }
      } else {
        re += '[^/]*'; // a single * never crosses a directory boundary
      }
    } else if (c === '?') {
      re += '[^/]';
    } else if (c === '{') {
      re += '(?:';
    } else if (c === '}') {
      re += ')';
    } else if (c === ',') {
      re += '|';
    } else {
      re += c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${re}$`, caseInsensitive ? 'i' : '');
}

/** Resolve the search base: an explicit path (must be in a root) or all roots. */
function searchBases(p?: string): string[] {
  if (p) return [assertInRoots(expandHome(p))];
  const roots = listRoots();
  if (!roots.length) throw new Error('no authorized roots; add a folder in Settings → Local Tools');
  return roots;
}

interface WalkOpts {
  onFile: (full: string, rel: string) => Promise<boolean> | boolean; // false → stop
  hidden?: boolean;
}

/** Depth-first walk bounded by file count and wall-clock budget.
 *  `withFileTypes` + an explicit `isSymbolicLink` skip keeps the walk inside
 *  the root: a symlink to `/` would otherwise escape the authorized boundary. */
async function walk(base: string, opts: WalkOpts): Promise<{ scanned: number; hitLimit: boolean }> {
  const deadline = Date.now() + WALK_BUDGET_MS;
  let scanned = 0;
  let hitLimit = false;
  const stack: string[] = [base];

  while (stack.length) {
    if (scanned >= MAX_FILES_SCANNED || Date.now() > deadline) {
      hitLimit = true;
      break;
    }
    const dir = stack.pop()!;
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      continue; // unreadable dir (permissions) — skip, don't fail the whole search
    }
    for (const e of entries) {
      if (e.isSymbolicLink()) continue;
      if (!opts.hidden && e.name.startsWith('.')) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        stack.push(full);
      } else if (e.isFile()) {
        scanned++;
        if (scanned >= MAX_FILES_SCANNED) {
          hitLimit = true;
          break;
        }
        const cont = await opts.onFile(full, path.relative(base, full));
        if (cont === false) {
          hitLimit = true;
          return { scanned, hitLimit };
        }
      }
    }
  }
  return { scanned, hitLimit };
}

/** Find files by name pattern (e.g. `**​/*.ts`, `src/**​/index.*`). */
export async function glob(i: {
  pattern: string;
  path?: string;
  hidden?: boolean;
  case_insensitive?: boolean;
}): Promise<ToolResult> {
  if (!i.pattern) throw new Error('pattern is required');
  const re = globToRegExp(i.pattern, i.case_insensitive ?? false);
  const out: string[] = [];
  let truncated = false;

  for (const base of searchBases(i.path)) {
    const { hitLimit } = await walk(base, {
      hidden: i.hidden,
      onFile: (full, rel) => {
        // Match against the root-relative path (so `**/*.ts` behaves) and the
        // bare filename (so a bare `*.ts` matches at any depth, which is what
        // a model almost always means).
        if (re.test(rel) || re.test(path.basename(rel))) {
          out.push(full);
          if (out.length >= MAX_GLOB_RESULTS) return false;
        }
        return true;
      }
    });
    if (hitLimit) truncated = true;
    if (out.length >= MAX_GLOB_RESULTS) {
      truncated = true;
      break;
    }
  }

  if (!out.length) return { output: `no files match ${i.pattern}` };
  const note = truncated ? `\n\n[truncated at ${out.length} results]` : '';
  return { output: out.join('\n') + note };
}

/** A NUL byte in the first block is the standard binary heuristic (same as
 *  grep's); scanning a binary produces garbage lines, not matches. */
function looksBinary(buf: Buffer): boolean {
  return buf.subarray(0, 8000).includes(0);
}

/** Search file CONTENT by regex, returning `path:line: text` hits. */
export async function grep(i: {
  pattern: string;
  path?: string;
  glob?: string;
  case_insensitive?: boolean;
  hidden?: boolean;
  max_results?: number;
}): Promise<ToolResult> {
  if (!i.pattern) throw new Error('pattern is required');
  let re: RegExp;
  try {
    re = new RegExp(i.pattern, i.case_insensitive ? 'i' : '');
  } catch (e) {
    throw new Error(`invalid regex: ${e instanceof Error ? e.message : String(e)}`);
  }
  const fileFilter = i.glob ? globToRegExp(i.glob, i.case_insensitive ?? false) : null;
  const cap = Math.min(Math.max(1, Math.floor(i.max_results ?? MAX_GREP_MATCHES)), MAX_GREP_MATCHES);
  const hits: string[] = [];
  let truncated = false;

  for (const base of searchBases(i.path)) {
    const { hitLimit } = await walk(base, {
      hidden: i.hidden,
      onFile: async (full, rel) => {
        if (fileFilter && !fileFilter.test(rel) && !fileFilter.test(path.basename(rel))) return true;
        let buf: Buffer;
        try {
          const st = await fsp.stat(full);
          if (st.size > MAX_GREP_FILE_BYTES) return true;
          buf = await fsp.readFile(full);
        } catch {
          return true; // unreadable file — skip
        }
        if (looksBinary(buf)) return true;
        const lines = buf.toString('utf8').split(/\r?\n/);
        for (let n = 0; n < lines.length; n++) {
          // `re` may carry /g from the model; lastIndex would then make test()
          // stateful across lines and skip every other match.
          re.lastIndex = 0;
          if (!re.test(lines[n])) continue;
          const text = lines[n].length > MAX_LINE_CHARS ? lines[n].slice(0, MAX_LINE_CHARS) + '…' : lines[n];
          hits.push(`${full}:${n + 1}: ${text}`);
          if (hits.length >= cap) return false;
        }
        return true;
      }
    });
    if (hitLimit) truncated = true;
    if (hits.length >= cap) {
      truncated = true;
      break;
    }
  }

  if (!hits.length) return { output: `no matches for ${i.pattern}` };
  const note = truncated ? `\n\n[truncated at ${hits.length} matches]` : '';
  return { output: hits.join('\n') + note };
}
