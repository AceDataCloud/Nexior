import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ToolInvoke } from './types';

const state = vi.hoisted(() => ({ userData: '', responses: [] as number[] }));
const showMessageBox = vi.hoisted(() => vi.fn(async () => ({ response: state.responses.shift() ?? 0 })));
vi.mock('electron', () => ({
  app: { getPath: () => state.userData },
  dialog: { showMessageBox },
  BrowserWindow: class BrowserWindow {}
}));

import { consentOk, grantKey, resetConsent } from './consent';
import { load, save } from './config';
import { dirGrantKey } from './dirGrants';
import { _resetRootsForTesting } from './fs';

const dirs: string[] = [];

function tmpUserData(): string {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'nx-consent-'));
  dirs.push(dir);
  state.userData = dir;
  return dir;
}

function invocation(name: string, input: Record<string, unknown>): ToolInvoke {
  return { name, input, sessionId: 'session-1' };
}

afterEach(() => {
  resetConsent();
  _resetRootsForTesting();
  state.responses = [];
  showMessageBox.mockClear();
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('local-tool consent choices', () => {
  it('persists the path-aware any-path choice as a tool-wide grant', async () => {
    const root = tmpUserData();
    const project = path.join(root, 'project');
    mkdirSync(project);
    const first = path.join(project, 'requirements.md');
    writeFileSync(first, 'first');
    state.responses = [3];

    const initial = invocation('fs.read_file', { path: first, offset: 405, limit: 30 });
    expect((await consentOk(initial, null)).ok).toBe(true);
    expect(load().grants).toEqual(['fs.read_file']);
    expect(load().grants).not.toContain(grantKey(initial));
    expect(load().roots).toEqual([realpathSync(project)]);

    const next = invocation('fs.read_file', { path: path.join(root, 'elsewhere.md'), offset: 1, limit: 100 });
    expect((await consentOk(next, null)).ok).toBe(true);
    expect(showMessageBox).toHaveBeenCalledTimes(1);

    const options = showMessageBox.mock.calls[0][0];
    expect(options.buttons).toHaveLength(5);
    expect(options.buttons[0]).toBe('Allow once');
    expect(options.buttons[1]).toBe('Allow for session');
    expect(options.buttons[2]).toMatch(/^Always allow in /);
    expect(options.buttons[2]).toContain(path.basename(project));
    expect(options.buttons[3]).toBe('Always allow (any path)');
    expect(options.buttons[4]).toBe('Deny');
    expect(options.detail).toContain('permits this tool in any folder you have authorized');
    expect(options.detail).toContain('other folders stay blocked');
  });

  it('keeps the directory choice scoped to that directory tree', async () => {
    const root = tmpUserData();
    const project = path.join(root, 'project');
    mkdirSync(project);
    state.responses = [2, 4];

    const initial = invocation('shell.exec', { command: 'npm test', cwd: project });
    expect((await consentOk(initial, null)).ok).toBe(true);
    expect(load().grants).toEqual([dirGrantKey('shell.exec', project)]);
    expect(load().grants).not.toContain('shell.exec');

    const nested = invocation('shell.exec', { command: 'npm run lint', cwd: path.join(project, 'src') });
    expect((await consentOk(nested, null)).ok).toBe(true);
    expect(showMessageBox).toHaveBeenCalledTimes(1);

    const outside = invocation('shell.exec', { command: 'npm run build', cwd: path.join(root, 'other') });
    expect((await consentOk(outside, null)).ok).toBe(false);
    expect(showMessageBox).toHaveBeenCalledTimes(2);
  });

  it('keeps the four-button always choice exact-input scoped', async () => {
    tmpUserData();
    state.responses = [2, 3];
    const initial = invocation('project.load_context', {});

    expect((await consentOk(initial, null)).ok).toBe(true);
    expect(load().grants).toEqual([grantKey(initial)]);
    expect(load().grants).not.toContain('project.load_context');

    const different = invocation('project.load_context', { mode: 'full' });
    expect((await consentOk(different, null)).ok).toBe(false);
    expect(showMessageBox).toHaveBeenCalledTimes(2);
    expect(showMessageBox.mock.calls[0][0].buttons).toEqual([
      'Allow once',
      'Allow for session',
      'Always allow',
      'Deny'
    ]);
  });

  it('does not widen a legacy exact-input grant', async () => {
    tmpUserData();
    const original = invocation('fs.grep', { pattern: 'TODO' });
    save({ roots: [], mcp: [], grants: [grantKey(original)], computerUse: false });

    expect((await consentOk(original, null)).ok).toBe(true);
    expect(showMessageBox).not.toHaveBeenCalled();

    state.responses = [3];
    const different = invocation('fs.grep', { pattern: 'FIXME' });
    expect((await consentOk(different, null)).ok).toBe(false);
    expect(showMessageBox).toHaveBeenCalledTimes(1);
    expect(load().grants).toEqual([grantKey(original)]);
    expect(load().grants).not.toContain('fs.grep');
  });
});
