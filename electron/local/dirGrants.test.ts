import { describe, expect, it } from 'vitest';
import os from 'node:os';
import path from 'node:path';
import { dirGrantKey, parseDirGrant, dirGrantCovers, invocationDir, describeDirGrant } from './dirGrants';
import type { ToolInvoke } from './types';

const inv = (name: string, input: Record<string, unknown>): ToolInvoke => ({ name, input, sessionId: 's' });

describe('directory grant keys', () => {
  it('round-trips a POSIX path', () => {
    const k = dirGrantKey('shell.exec', '/Users/me/proj');
    expect(parseDirGrant(k)).toEqual({ tool: 'shell.exec', dir: '/Users/me/proj' });
  });

  it('round-trips a Windows path (the dir itself contains a colon)', () => {
    const k = dirGrantKey('shell.exec', 'C:\\work\\repo');
    expect(parseDirGrant(k)).toEqual({ tool: 'shell.exec', dir: 'C:\\work\\repo' });
  });

  it('ignores keys of the other two grant shapes', () => {
    expect(parseDirGrant('shell.run_command')).toBeNull(); // tool-wide
    expect(parseDirGrant('fs.read_file:{"path":"/a"}')).toBeNull(); // input-bound
  });

  it('renders a readable description', () => {
    expect(describeDirGrant(dirGrantKey('fs.edit_file', '/p'))).toBe('fs.edit_file in /p');
  });
});

describe('invocationDir', () => {
  it('uses cwd for shell tools', () => {
    expect(invocationDir(inv('shell.exec', { command: 'ls', cwd: '/a/b' }))).toBe('/a/b');
  });

  it('uses the directory itself for list_dir', () => {
    expect(invocationDir(inv('fs.list_dir', { path: '/a/b' }))).toBe('/a/b');
  });

  it('uses the parent directory for file tools', () => {
    expect(invocationDir(inv('fs.read_file', { path: '/a/b/c.ts' }))).toBe('/a/b');
  });

  it('expands ~ the way the models write it', () => {
    expect(invocationDir(inv('shell.exec', { command: 'ls', cwd: '~/proj' }))).toBe(path.join(os.homedir(), 'proj'));
  });

  it('returns null for a shell call with no cwd (never guesses)', () => {
    // Guessing the session cwd here would let a grant for one folder silently
    // cover a command the user believes runs somewhere else.
    expect(invocationDir(inv('shell.exec', { command: 'rm -rf /' }))).toBeNull();
  });

  it('returns null for a relative path', () => {
    expect(invocationDir(inv('shell.exec', { command: 'ls', cwd: 'sub' }))).toBeNull();
  });

  it('returns null for a tool with no directory at all', () => {
    expect(invocationDir(inv('computer.screenshot', {}))).toBeNull();
  });
});

describe('dirGrantCovers', () => {
  const grants = [dirGrantKey('shell.exec', '/repo')];

  it('covers a call in the granted folder', () => {
    expect(dirGrantCovers(grants, inv('shell.exec', { command: 'ls', cwd: '/repo' }))).toBe(true);
  });

  it('covers a call in a nested folder', () => {
    expect(dirGrantCovers(grants, inv('shell.exec', { command: 'ls', cwd: '/repo/src/deep' }))).toBe(true);
  });

  it('covers a DIFFERENT command in the granted folder (the whole point)', () => {
    // An input-bound grant would re-prompt here; that prompt storm is what
    // drives users to the unrestricted tool-wide grant instead.
    expect(dirGrantCovers(grants, inv('shell.exec', { command: 'npm test -- --watch', cwd: '/repo' }))).toBe(true);
  });

  it('does NOT cover a sibling folder with a shared prefix', () => {
    // `/repository` must not match a grant for `/repo`.
    expect(dirGrantCovers(grants, inv('shell.exec', { command: 'ls', cwd: '/repository' }))).toBe(false);
  });

  it('does NOT cover a parent folder', () => {
    expect(dirGrantCovers(grants, inv('shell.exec', { command: 'ls', cwd: '/' }))).toBe(false);
  });

  it('does NOT cover a different tool in the same folder', () => {
    expect(dirGrantCovers(grants, inv('fs.write_file', { path: '/repo/a.ts', content: 'x' }))).toBe(false);
  });

  it('does NOT cover a call with no directory', () => {
    expect(dirGrantCovers(grants, inv('shell.exec', { command: 'ls' }))).toBe(false);
  });

  it('ignores tool-wide and input-bound grants when matching', () => {
    const others = ['shell.exec', 'shell.exec:{"command":"ls"}'];
    expect(dirGrantCovers(others, inv('shell.exec', { command: 'ls', cwd: '/repo' }))).toBe(false);
  });

  it('matches the file tools by their parent directory', () => {
    const g = [dirGrantKey('fs.edit_file', '/repo/src')];
    expect(dirGrantCovers(g, inv('fs.edit_file', { path: '/repo/src/a.ts', old_string: 'a', new_string: 'b' }))).toBe(
      true
    );
    expect(dirGrantCovers(g, inv('fs.edit_file', { path: '/repo/other/a.ts', old_string: 'a', new_string: 'b' }))).toBe(
      false
    );
  });
});
