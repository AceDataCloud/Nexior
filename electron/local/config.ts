import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { LocalConfig } from './types';

// Persisted at userData/local-tools.json (0600). Holds the user-authorized
// root folders for file tools and the local MCP server list.
const file = (): string => path.join(app.getPath('userData'), 'local-tools.json');

export function load(): LocalConfig {
  try {
    // Strip a leading UTF-8 BOM: an externally-edited config (e.g. saved by
    // Notepad) would otherwise make JSON.parse throw and silently wipe every
    // authorized root, MCP server and grant.
    const raw = fs.readFileSync(file(), 'utf8').replace(/^\uFEFF/, '');
    const c = JSON.parse(raw) as Partial<LocalConfig>;
    return {
      roots: c.roots ?? [],
      mcp: c.mcp ?? [],
      grants: c.grants ?? [],
      computerUse: c.computerUse ?? false,
      workingDir: c.workingDir
    };
  } catch {
    return { roots: [], mcp: [], grants: [], computerUse: false };
  }
}

/** The user's current project directory, or undefined when none is chosen.
 *  Read straight from disk so the shell + project-context tools see the same
 *  value the renderer saved, with no in-memory copy to keep in sync. */
export function getWorkingDir(): string | undefined {
  return load().workingDir || undefined;
}

/** Merge a renderer save payload onto the stored config.
 *
 * Pure, and separate from the IPC handler, because this is where a field gets
 * silently lost: the renderer has FOUR read-modify-write save paths (folders,
 * MCP, reconnect, Computer Use) and each sends only the slice it owns. Any
 * field absent from the payload must fall back to the stored value, or e.g.
 * saving an MCP server would wipe the working directory.
 */
export function mergeConfigSave(cur: LocalConfig, cfg: LocalConfig): LocalConfig {
  return {
    ...cur,
    roots: cfg.roots,
    mcp: cfg.mcp,
    computerUse: cfg.computerUse ?? cur.computerUse ?? false,
    workingDir: cfg.workingDir ?? cur.workingDir
  };
}

/** The set of folders to authorize: the explicit list plus the working
 *  directory. Picking a project directory implicitly authorizes it — otherwise
 *  the user picks a folder and then finds the AI cannot read it, and has to add
 *  the same path a second time under Settings. Kept OUT of `config.roots` so
 *  the "authorized folders" list doesn't gain a row the user never added
 *  (and can't meaningfully remove while it is the working directory). */
export function rootsWithWorkingDir(roots: string[], workingDir?: string): string[] {
  if (!workingDir) return roots;
  return roots.includes(workingDir) ? roots : [...roots, workingDir];
}

export function save(c: LocalConfig): void {
  fs.writeFileSync(file(), JSON.stringify(c, null, 2), { mode: 0o600 });
}
