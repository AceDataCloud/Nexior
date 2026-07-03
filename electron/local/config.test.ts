import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// config.ts reads `app.getPath('userData')`; point it at a per-test temp dir.
const state = vi.hoisted(() => ({ userData: '' }));
vi.mock('electron', () => ({ app: { getPath: () => state.userData } }));

import { load } from './config';

describe('local-tools config load', () => {
  const dirs: string[] = [];
  function tmpUserData(): string {
    const d = mkdtempSync(path.join(os.tmpdir(), 'nx-cfg-'));
    dirs.push(d);
    state.userData = d;
    return d;
  }
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  const CFG = {
    roots: ['/tmp/a'],
    mcp: [{ id: 'playwright', command: 'npx', args: ['-y', '@playwright/mcp@latest'], enabled: true }],
    grants: ['shell.run_command'],
    computerUse: true
  };

  it('parses a normal (BOM-less) config file', () => {
    const d = tmpUserData();
    writeFileSync(path.join(d, 'local-tools.json'), JSON.stringify(CFG));
    const c = load();
    expect(c.roots).toEqual(['/tmp/a']);
    expect(c.mcp).toHaveLength(1);
    expect(c.grants).toEqual(['shell.run_command']);
    expect(c.computerUse).toBe(true);
  });

  // Regression: an externally-edited config (e.g. saved by Notepad) can carry a
  // UTF-8 BOM. Before the fix, JSON.parse threw and load() silently returned
  // empty defaults — wiping every root, MCP server and grant from the UI.
  it('parses a config file that begins with a UTF-8 BOM', () => {
    const d = tmpUserData();
    writeFileSync(path.join(d, 'local-tools.json'), '\uFEFF' + JSON.stringify(CFG));
    const c = load();
    expect(c.mcp).toHaveLength(1);
    expect(c.mcp[0].id).toBe('playwright');
    expect(c.roots).toEqual(['/tmp/a']);
    expect(c.grants).toEqual(['shell.run_command']);
    expect(c.computerUse).toBe(true);
  });

  it('returns safe defaults when the file is missing or malformed', () => {
    const d = tmpUserData();
    // no file written
    expect(load()).toEqual({ roots: [], mcp: [], grants: [], computerUse: false });
    writeFileSync(path.join(d, 'local-tools.json'), '{ not json');
    expect(load()).toEqual({ roots: [], mcp: [], grants: [], computerUse: false });
  });
});
