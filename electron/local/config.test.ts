import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// config.ts reads `app.getPath('userData')`; point it at a per-test temp dir.
const state = vi.hoisted(() => ({ userData: '' }));
vi.mock('electron', () => ({ app: { getPath: () => state.userData } }));

import { load, getWorkingDir, rootsWithWorkingDir, mergeConfigSave } from './config';

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

describe('working directory', () => {
  const dirs: string[] = [];
  function tmpUserData(): string {
    const d = mkdtempSync(path.join(os.tmpdir(), 'nx-wd-'));
    dirs.push(d);
    state.userData = d;
    return d;
  }
  afterEach(() => {
    for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
  });

  // Regression guard: `load()` builds its result field-by-field, so a field
  // missing from that list is silently dropped on every read→write round trip.
  it('survives a load round trip', () => {
    const d = tmpUserData();
    writeFileSync(path.join(d, 'local-tools.json'), JSON.stringify({ roots: ['/tmp/a'], mcp: [], workingDir: '/tmp/proj' }));
    expect(load().workingDir).toBe('/tmp/proj');
    expect(getWorkingDir()).toBe('/tmp/proj');
  });

  it('reports undefined — not an empty string — when unset', () => {
    const d = tmpUserData();
    writeFileSync(path.join(d, 'local-tools.json'), JSON.stringify({ roots: [], mcp: [], workingDir: '' }));
    expect(getWorkingDir()).toBeUndefined();
  });

  it('is undefined when the config is missing entirely', () => {
    tmpUserData();
    expect(getWorkingDir()).toBeUndefined();
  });

  describe('rootsWithWorkingDir', () => {
    it('authorizes the working directory alongside the explicit roots', () => {
      // Picking a project folder must make it readable; otherwise the user
      // chooses a folder and then finds the AI cannot open anything in it.
      expect(rootsWithWorkingDir(['/a'], '/proj')).toEqual(['/a', '/proj']);
    });

    it('does not duplicate a working directory already listed as a root', () => {
      expect(rootsWithWorkingDir(['/a', '/proj'], '/proj')).toEqual(['/a', '/proj']);
    });

    it('is a no-op when no working directory is set', () => {
      expect(rootsWithWorkingDir(['/a'], undefined)).toEqual(['/a']);
    });
  });

  // The renderer has four read-modify-write save paths and none of them sends
  // `workingDir`. Every one of them must leave it alone.
  describe('mergeConfigSave', () => {
    const stored = {
      roots: ['/a'],
      mcp: [],
      grants: ['fs.read_file'],
      computerUse: true,
      workingDir: '/proj'
    };

    it('preserves the working directory when the payload omits it', () => {
      // This is the "save MCP servers wipes the project folder" regression.
      const next = mergeConfigSave(stored, { roots: ['/a'], mcp: [{ id: 'x', command: 'y', args: [] }] });
      expect(next.workingDir).toBe('/proj');
      expect(next.grants).toEqual(['fs.read_file']);
      expect(next.computerUse).toBe(true);
    });

    it('applies a new working directory when the payload sets one', () => {
      const next = mergeConfigSave(stored, { roots: ['/a'], mcp: [], workingDir: '/other' });
      expect(next.workingDir).toBe('/other');
    });

    it('still lets roots and mcp be replaced wholesale', () => {
      const next = mergeConfigSave(stored, { roots: ['/b'], mcp: [] });
      expect(next.roots).toEqual(['/b']);
    });
  });
});
