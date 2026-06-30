import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import type { LocalConfig } from './types';

// Persisted at userData/local-tools.json (0600). Holds the user-authorized
// root folders for file tools and the local MCP server list.
const file = (): string => path.join(app.getPath('userData'), 'local-tools.json');

export function load(): LocalConfig {
  try {
    const c = JSON.parse(fs.readFileSync(file(), 'utf8')) as Partial<LocalConfig>;
    return { roots: c.roots ?? [], mcp: c.mcp ?? [], grants: c.grants ?? [], computerUse: c.computerUse ?? false };
  } catch {
    return { roots: [], mcp: [], grants: [], computerUse: false };
  }
}

export function save(c: LocalConfig): void {
  fs.writeFileSync(file(), JSON.stringify(c, null, 2), { mode: 0o600 });
}
