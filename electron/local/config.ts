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
    return { roots: c.roots ?? [], mcp: c.mcp ?? [], grants: c.grants ?? [], computerUse: c.computerUse ?? false };
  } catch {
    return { roots: [], mcp: [], grants: [], computerUse: false };
  }
}

export function save(c: LocalConfig): void {
  fs.writeFileSync(file(), JSON.stringify(c, null, 2), { mode: 0o600 });
}
