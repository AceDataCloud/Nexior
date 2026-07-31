import path from 'node:path';
import { expandHome } from './fs';
import type { ToolInvoke } from './types';

// Directory-scoped grants: the missing middle tier between an input-bound grant
// ("this exact command, forever") and a tool-wide one ("any command, anywhere,
// no prompt").
//
// The two existing tiers force a bad choice on anyone doing real work. An
// input-bound grant re-prompts on every new command, so a refactor becomes a
// prompt storm; the escape hatch is a bare tool-wide grant, which for
// `shell.*` is completely unrestricted — the code's own comment says
// "unrestricted by design". Users take the second option and end up with an
// unbounded local exec grant.
//
// A directory grant says: "run this tool anywhere under ~/Projects/foo without
// asking, and keep asking everywhere else."

/** Stored form: `dir:<tool.name>:<canonical dir>`. Distinct prefix so it can
 *  never collide with an input-bound (`<tool>:<json>`) or tool-wide (`<tool>`)
 *  key in the same `grants` array. */
export const DIR_GRANT_PREFIX = 'dir:';

export function dirGrantKey(toolName: string, dir: string): string {
  return `${DIR_GRANT_PREFIX}${toolName}:${dir}`;
}

export interface ParsedDirGrant {
  tool: string;
  dir: string;
}

/** Parse a stored directory grant. Returns null for any other key shape.
 *  Splits at the FIRST colon after the prefix: a tool name never contains one,
 *  while a Windows dir does (`C:\...`). */
export function parseDirGrant(key: string): ParsedDirGrant | null {
  if (!key.startsWith(DIR_GRANT_PREFIX)) return null;
  const rest = key.slice(DIR_GRANT_PREFIX.length);
  const i = rest.indexOf(':');
  if (i <= 0) return null;
  const tool = rest.slice(0, i);
  const dir = rest.slice(i + 1);
  if (!tool || !dir) return null;
  return { tool, dir };
}

/** Is `target` inside (or equal to) `dir`? Separator-boundary check, so
 *  `/a/bc` is NOT considered inside `/a/b`. */
function within(target: string, dir: string): boolean {
  return target === dir || target.startsWith(dir + path.sep);
}

/**
 * The directory a given invocation would operate in, or null when the tool has
 * no meaningful directory (so it can never match a directory grant).
 *
 * Deliberately conservative: a shell command with NO explicit cwd returns null
 * rather than guessing the session's directory. Resolving it here would let a
 * grant for one folder silently cover a command the user believes runs
 * somewhere else.
 */
export function invocationDir(inv: ToolInvoke): string | null {
  const input = (inv.input ?? {}) as Record<string, unknown>;
  const raw = typeof input.cwd === 'string' ? input.cwd : typeof input.path === 'string' ? input.path : null;
  if (!raw) return null;
  const expanded = expandHome(raw);
  if (!path.isAbsolute(expanded)) return null; // relative → ambiguous, never matches
  // `fs.list_dir` targets the directory itself; file tools target a file, whose
  // directory is the unit a grant covers.
  if (inv.name === 'fs.list_dir' || typeof input.cwd === 'string') return expanded;
  return path.dirname(expanded);
}

/**
 * Does any stored directory grant cover this invocation?
 *
 * A grant matches only when the tool name matches exactly AND the invocation's
 * directory resolves inside the granted directory. Note this check runs on the
 * RAW (pre-realpath) path; fs tools independently re-resolve and re-validate
 * against ROOTS, so a symlink can't turn a grant into an escape — it can at
 * worst skip a prompt for a call that then fails the boundary check.
 */
export function dirGrantCovers(grants: readonly string[], inv: ToolInvoke): boolean {
  const dir = invocationDir(inv);
  if (!dir) return false;
  for (const key of grants) {
    const parsed = parseDirGrant(key);
    if (!parsed || parsed.tool !== inv.name) continue;
    if (within(dir, parsed.dir)) return true;
  }
  return false;
}

/** Human-readable line for the consent dialog / Settings list. */
export function describeDirGrant(key: string): string | null {
  const p = parseDirGrant(key);
  return p ? `${p.tool} in ${p.dir}` : null;
}
