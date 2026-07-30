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
function expandHome(p: string): string {
  if (p === '~') return os.homedir();
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(os.homedir(), p.slice(2));
  return p;
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

export async function read_file(i: { path: string }): Promise<ToolResult> {
  return { output: await fsp.readFile(resolveExisting(i.path), 'utf8') };
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
