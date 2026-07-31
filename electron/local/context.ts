import fsp from 'node:fs/promises';
import path from 'node:path';
import type { ToolResult } from './types';
import { assertInRoots, expandHome, listRoots } from './fs';
import { currentWorkingDir } from './shellSession';
import { getWorkingDir } from './config';

// Project context: the convention files a coding agent is expected to obey
// (AGENTS.md / CLAUDE.md and friends) plus the project's own slash commands.
// Without this the model has no idea a repo has house rules — it writes code
// that passes tests but violates every convention the team agreed on.

// Ordered by precedence: the first name found in a directory wins, so a repo
// carrying both CLAUDE.md and AGENTS.md doesn't get the same rules twice.
const CONTEXT_FILES = ['AGENTS.md', 'CLAUDE.md', 'CONVENTIONS.md', '.cursorrules', '.github/copilot-instructions.md'];

const MAX_TOTAL_CHARS = 60_000; // a very large AGENTS.md shouldn't eat the whole window
const MAX_COMMANDS = 100;
const MAX_IMPORT_DEPTH = 3; // CLAUDE.md → @AGENTS.md → … ; deep chains are pathological

/** Directories to probe, from the given dir UP to (and including) the
 *  authorized root that contains it. Conventions cascade: a monorepo root
 *  holds the shared rules, a package dir may add its own. */
function chainToRoot(start: string): string[] {
  const roots = listRoots();
  const owning = roots.find((r) => start === r || start.startsWith(r + path.sep));
  const stopAt = owning ?? start;
  const out: string[] = [];
  let cur = start;
  // Bounded by the root, and by parent===cur at the filesystem root.
  for (;;) {
    out.push(cur);
    if (cur === stopAt) break;
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return out.reverse(); // outermost first, so nearer files override/append last
}

/** Resolve `@path/to/file.md` imports (the syntax CLAUDE.md uses to pull in a
 *  shared AGENTS.md). Only single-line `@...` directives, only inside roots. */
async function inlineImports(text: string, baseDir: string, depth: number, seen: Set<string>): Promise<string> {
  if (depth >= MAX_IMPORT_DEPTH) return text;
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const m = /^@([^\s`]+\.(?:md|markdown))\s*$/.exec(line.trim());
    if (!m) {
      out.push(line);
      continue;
    }
    let resolved: string;
    try {
      resolved = assertInRoots(path.resolve(baseDir, m[1]));
    } catch {
      out.push(line); // outside the authorized roots — leave the directive as text
      continue;
    }
    if (seen.has(resolved)) {
      out.push(`[skipped circular import: ${m[1]}]`);
      continue;
    }
    seen.add(resolved);
    try {
      const imported = await fsp.readFile(resolved, 'utf8');
      out.push(`<!-- imported from ${resolved} -->`);
      out.push(await inlineImports(imported, path.dirname(resolved), depth + 1, seen));
    } catch {
      out.push(line);
    }
  }
  return out.join('\n');
}

/** List the project's own slash commands (`.claude/commands/*.md`) by name +
 *  first-line description. Names only — bodies are loaded on demand via
 *  fs.read_file, so a repo with 40 commands costs ~40 lines, not 40 files. */
async function listCommands(dir: string): Promise<string[]> {
  const cmdDir = path.join(dir, '.claude', 'commands');
  let entries;
  try {
    entries = await fsp.readdir(cmdDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out: string[] = [];
  for (const e of entries) {
    if (out.length >= MAX_COMMANDS) break;
    if (!e.isFile() || !e.name.endsWith('.md')) continue;
    const full = path.join(cmdDir, e.name);
    let desc = '';
    try {
      const head = (await fsp.readFile(full, 'utf8')).slice(0, 500).split(/\r?\n/);
      // Prefer a `description:` frontmatter line; else the first non-empty,
      // non-heading line.
      desc =
        head.find((l) => /^description:/i.test(l.trim()))?.replace(/^description:\s*/i, '') ??
        head.find((l) => l.trim() && !l.startsWith('#') && !l.startsWith('---'))?.trim() ??
        '';
    } catch {
      /* unreadable command file — list it without a description */
    }
    out.push(`/${e.name.replace(/\.md$/, '')}${desc ? ` — ${desc.slice(0, 120)}` : ''} (${full})`);
  }
  return out;
}

/**
 * Load the convention files that govern a project directory, walking from the
 * authorized root down to the given path so nested rules append to shared ones.
 */
export async function load_project_context(i: { path?: string; sessionId?: string }): Promise<ToolResult> {
  let start: string;
  if (i.path) {
    start = assertInRoots(expandHome(i.path));
  } else {
    // Resolution order, narrowest first:
    //   1. the session's live shell cwd (the model may have cd'd elsewhere)
    //   2. the user's configured project directory
    // Falling back to an arbitrary entry of the roots list (whichever the user
    // happened to add first) would load the WRONG project's rules without the
    // model ever noticing — that mistake is why the first attempt at this tool
    // was withdrawn.
    const wd = currentWorkingDir(i.sessionId) ?? getWorkingDir();
    if (!wd) {
      const roots = listRoots();
      // A single authorized folder is unambiguous, so use it rather than
      // failing on a technicality.
      if (roots.length === 1) {
        start = roots[0];
      } else if (!roots.length) {
        throw new Error('no authorized roots; choose a project folder first');
      } else {
        throw new Error(
          `no working directory set and ${roots.length} folders are authorized — ` +
            `choose a project folder first, or pass an explicit path. Authorized: ${roots.join(', ')}`
        );
      }
    } else {
      start = assertInRoots(expandHome(wd));
    }
  }
  // A file path is a natural thing for a model to pass ("what rules apply to
  // this file?"); resolve it to its directory rather than failing.
  try {
    if ((await fsp.stat(start)).isFile()) start = path.dirname(start);
  } catch {
    /* assertInRoots already proved it exists; a race here is not worth failing */
  }

  const sections: string[] = [];
  const found: string[] = [];
  const seen = new Set<string>();
  let total = 0;
  let truncated = false;

  for (const dir of chainToRoot(start)) {
    for (const name of CONTEXT_FILES) {
      const full = path.join(dir, name);
      let text: string;
      try {
        text = await fsp.readFile(full, 'utf8');
      } catch {
        continue;
      }
      seen.add(full);
      const expanded = await inlineImports(text, dir, 0, seen);
      const remaining = MAX_TOTAL_CHARS - total;
      if (remaining <= 0) {
        truncated = true;
        break;
      }
      const body = expanded.length > remaining ? expanded.slice(0, remaining) + '\n[…truncated]' : expanded;
      total += body.length;
      if (expanded.length > remaining) truncated = true;
      found.push(full);
      sections.push(`===== ${full} =====\n${body}`);
      break; // first match in this dir wins (see CONTEXT_FILES ordering)
    }
  }

  const commands = await listCommands(start);
  // Commands may live at the repo root while `start` is a subdirectory.
  if (!commands.length) {
    for (const dir of chainToRoot(start)) {
      const c = await listCommands(dir);
      if (c.length) {
        commands.push(...c);
        break;
      }
    }
  }

  if (!sections.length && !commands.length) {
    return { output: `no project context found (looked for ${CONTEXT_FILES.join(', ')} from ${start} up to its root)` };
  }

  const parts: string[] = [];
  if (sections.length) {
    parts.push(
      'Project conventions below are AUTHORITATIVE for work in this directory. Follow them over your defaults.\n'
    );
    parts.push(sections.join('\n\n'));
  }
  if (commands.length) {
    parts.push(
      `\n===== project commands (.claude/commands) =====\n` +
        `Read one with fs.read_file to see its full procedure.\n` +
        commands.join('\n')
    );
  }
  if (truncated) parts.push('\n[context truncated at the size cap; read specific files with fs.read_file]');
  if (found.length) parts.push(`\n[loaded: ${found.join(', ')}]`);
  return { output: parts.join('\n') };
}
