import fsp from 'node:fs/promises';
import { realpathSync } from 'node:fs';
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
const SESSION_ROOTS = new Set<string>();

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
  return ROOTS.some(ok) || [...SESSION_ROOTS].some(ok);
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

// Authorize a path the user just consented to via the tool popup, so the
// matching read/list/write actually passes inRootDir. Without this, approving
// the consent dialog would still fail with "path outside allowed roots" unless
// the folder was separately added in Settings. Returns the canonical (realpath)
// dir/file that was granted, or null if it can't be resolved. For writes the
// target file may not exist yet, so authorize its parent directory.
export function authorizeConsentedPath(name: string, p: string): string | null {
  try {
    const expanded = expandHome(p);
    const target =
      name === 'fs.write_file' ? realpathSync(path.dirname(expanded)) : realpathSync(expanded);
    SESSION_ROOTS.add(target);
    return target;
  } catch {
    return null;
  }
}

// Test hook: clear all roots (persistent + session) between cases.
export function _resetRootsForTesting(): void {
  ROOTS = [];
  SESSION_ROOTS.clear();
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
  const tmp = f + '.tmp';
  await fsp.writeFile(tmp, i.content, { flag: 'wx', mode: 0o600 }); // no symlink follow, not world-readable
  await fsp.rename(tmp, f); // atomic
  return { output: `wrote ${i.content.length} bytes` };
}
