import fsp from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import type { ToolResult } from './types';

// File tools confined to user-authorized roots. Mirrors protocol.ts resolveSafe:
// separator boundary + realpath defeats symlink / sibling-prefix escape.
let ROOTS: string[] = [];

// Roots authorized at runtime by an explicit consent grant (the popup the user
// approves for a specific path). In-memory only; "Always allow" additionally
// persists the granted dir to config.roots (see consent.ts) so it survives a
// restart via setRoots(). Kept separate from ROOTS so a one-shot/session grant
// never silently becomes a permanent root.
//
// Two tiers, tracked separately BY DESIGN. A folder can be granted by both an
// "Allow for session" approval and a later "Allow once" one; releasing the
// once-grant must not revoke the session grant, so a single unowned set would
// be wrong. Once-grants are additionally reference-counted because parallel
// client tools can each hold one for the same folder — the last release wins.
const SESSION_ROOTS = new Set<string>();
const ONCE_ROOTS = new Map<string, number>();

export function setRoots(roots: string[]): void {
  ROOTS = roots
    .map((p) => {
      try {
        return realpathSync(p);
      } catch {
        return '';
      }
    })
    .filter(Boolean);
}

function inRootDir(full: string): boolean {
  const ok = (r: string) => full === r || full.startsWith(r + path.sep);
  return ROOTS.some(ok) || [...SESSION_ROOTS].some(ok) || [...ONCE_ROOTS.keys()].some(ok);
}

// Models commonly pass `~/Desktop`; Node never expands `~`, so realpathSync
// would walk a literal `/~` and ENOENT. Expand a leading `~`/`~/` to the home
// dir (which is typically what an authorized root sits under).
export function expandHome(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(os.homedir(), p.slice(2));
  return p;
}

// Every authorized root (persistent + session + live once-grants), for tools
// that search across all of them when no explicit path is given. Includes the
// once tier so a folder the user just approved is searchable for that call.
export function listRoots(): string[] {
  return [...ROOTS, ...SESSION_ROOTS, ...ONCE_ROOTS.keys()];
}

// Public boundary check for non-fs tools (search): resolve and assert the path
// stays inside an authorized root. Same realpath semantics as resolveExisting.
export function assertInRoots(p: string): string {
  return resolveExisting(p);
}

// For reads/lists: resolve the real file and assert it stays in a root (blocks
// an in-root symlink pointing outside). For writes: parent must realpath into a
// root; the new file inherits that boundary.
function resolveExisting(p: string): string {
  const real = realpathSync(expandHome(p));
  if (!inRootDir(real)) throw new Error('path outside allowed roots');
  return real;
}
function resolveForWrite(p: string): string {
  const expanded = expandHome(p);
  let dir: string;
  try {
    dir = realpathSync(path.dirname(expanded));
  } catch {
    throw new Error('parent dir missing');
  }
  const full = path.join(dir, path.basename(expanded));
  if (!inRootDir(full)) throw new Error('path outside allowed roots');
  return full;
}

// Authorize the FOLDER a consented path lives in, so the matching read/list/
// write actually passes inRootDir. Without this, approving the consent dialog
// would still fail with "path outside allowed roots" unless the folder was
// separately added in Settings.
//
// Scope is deliberately the containing DIRECTORY for every fs tool — reading
// one file almost always implies reading its siblings (that is the useful unit
// of work), and a file-scoped grant would prompt again for every neighbour. The
// consent dialog states the folder being granted, so the popup matches what is
// actually authorized. Returns the canonical (realpath) directory, or null if
// it can't be resolved.
//
// `fs.list_dir` already targets a directory; `read_file`/`write_file` target a
// file, so we take its parent. A write target may not exist yet, hence the
// dirname is resolved rather than the path itself.
//
// `once` routes the grant into the reference-counted ONCE_ROOTS tier so
// releasing it later can't revoke a session grant that happens to name the same
// folder, nor a sibling parallel call's grant.
export function authorizeConsentedPath(name: string, p: string, once = false): string | null {
  try {
    const expanded = expandHome(p);
    const target = name === 'fs.list_dir' ? realpathSync(expanded) : realpathSync(path.dirname(expanded));
    if (once) ONCE_ROOTS.set(target, (ONCE_ROOTS.get(target) ?? 0) + 1);
    else SESSION_ROOTS.add(target);
    return target;
  } catch {
    return null;
  }
}

// Release one "Allow once" hold on a folder. Reference-counted: the root stays
// authorized until every parallel once-grant on it has been released, and the
// session/persistent tiers are untouched either way.
export function revokeOnceRoot(dir: string | null): void {
  if (!dir) return;
  const n = ONCE_ROOTS.get(dir);
  if (n === undefined) return;
  if (n <= 1) ONCE_ROOTS.delete(dir);
  else ONCE_ROOTS.set(dir, n - 1);
}

// Test hook: clear all roots (persistent + session + once) between cases.
export function _resetRootsForTesting(): void {
  ROOTS = [];
  SESSION_ROOTS.clear();
  ONCE_ROOTS.clear();
}

// A whole-file read of a large source file can dwarf the model's context
// budget, so reads are paginated by line: `offset` (1-based) + `limit`.
const DEFAULT_READ_LIMIT = 2000;

export async function read_file(i: { path: string; offset?: number; limit?: number }): Promise<ToolResult> {
  const text = await fsp.readFile(resolveExisting(i.path), 'utf8');
  const paginate = i.offset !== undefined || i.limit !== undefined;
  if (!paginate) {
    const total = countLines(text);
    if (total <= DEFAULT_READ_LIMIT) return { output: text };
    // Silently returning the head would let the model believe it saw the whole
    // file and "rewrite" it from a truncated view, destroying the tail.
    const head = text.split(/\r?\n/).slice(0, DEFAULT_READ_LIMIT).join('\n');
    return {
      output: `${head}\n\n[truncated: showing lines 1-${DEFAULT_READ_LIMIT} of ${total}; pass offset/limit to read more]`
    };
  }
  const lines = text.split(/\r?\n/);
  const start = Math.max(1, Math.floor(i.offset ?? 1));
  const limit = Math.max(1, Math.floor(i.limit ?? DEFAULT_READ_LIMIT));
  const slice = lines.slice(start - 1, start - 1 + limit);
  if (!slice.length) return { output: `[no lines: file has ${lines.length} lines, offset ${start} is past the end]` };
  const end = start + slice.length - 1;
  return { output: `${slice.join('\n')}\n\n[lines ${start}-${end} of ${lines.length}]` };
}

function countLines(text: string): number {
  return text.split(/\r?\n/).length;
}

export async function list_dir(i: { path: string }): Promise<ToolResult> {
  const entries = await fsp.readdir(resolveExisting(i.path), { withFileTypes: true });
  return { output: entries.map((d) => (d.isDirectory() ? d.name + '/' : d.name)).join('\n') };
}

export async function write_file(i: { path: string; content: string }): Promise<ToolResult> {
  const f = resolveForWrite(i.path);
  // Unique temp name per call: a fixed `<file>.tmp` with flag 'wx' made the
  // path permanently unwritable (EEXIST) once a crash or a concurrent write
  // orphaned one, and the error named a file the user never knew existed.
  const tmp = `${f}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`;
  try {
    await fsp.writeFile(tmp, i.content, { flag: 'wx', mode: 0o600 }); // no symlink follow, not world-readable
    await fsp.rename(tmp, f); // atomic
  } catch (e) {
    await fsp.unlink(tmp).catch(() => undefined); // never leave a partial temp behind
    throw e;
  }
  return { output: `wrote ${i.content.length} bytes` };
}

/**
 * Exact string replacement — the difference between "can edit code" and
 * "must rewrite whole files". `old_string` must appear EXACTLY once unless
 * `replace_all` is set, so an ambiguous match fails loudly instead of
 * silently editing the wrong occurrence.
 */
export async function edit_file(i: {
  path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}): Promise<ToolResult> {
  const f = resolveExisting(i.path);
  if (i.old_string === i.new_string) throw new Error('old_string and new_string are identical');
  const text = await fsp.readFile(f, 'utf8');
  const count = occurrences(text, i.old_string);
  if (count === 0) throw new Error('old_string not found in file');
  if (count > 1 && !i.replace_all) {
    throw new Error(`old_string is not unique (${count} matches); add surrounding context or set replace_all`);
  }
  const next = i.replace_all ? text.split(i.old_string).join(i.new_string) : text.replace(i.old_string, i.new_string);
  // Preserve the original mode: a fixed 0600 would silently strip the
  // executable bit off a script, or make a world-readable file private.
  const mode = (await fsp.stat(f)).mode & 0o777;
  // Unique temp name + cleanup, same rationale as write_file: a fixed
  // `<file>.tmp` orphaned by a crash makes the path unwritable forever.
  const tmp = `${f}.${process.pid}.${randomUUID().slice(0, 8)}.tmp`;
  try {
    await fsp.writeFile(tmp, next, { flag: 'wx', mode });
    await fsp.rename(tmp, f); // atomic
  } catch (e) {
    await fsp.unlink(tmp).catch(() => undefined);
    throw e;
  }
  return { output: `replaced ${count === 1 || !i.replace_all ? 1 : count} occurrence(s) in ${f}` };
}

// `split().length - 1` rather than a regex: old_string is arbitrary user text
// and must never be interpreted as a pattern.
function occurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  return haystack.split(needle).length - 1;
}
