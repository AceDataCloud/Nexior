import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { setRoots, _resetRootsForTesting } from './fs';
import { load_project_context } from './context';

function repo() {
  const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-ctx-')));
  mkdirSync(path.join(base, 'pkg'));
  setRoots([base]);
  return base;
}

describe('project.load_context', () => {
  afterEach(() => _resetRootsForTesting());

  it('loads AGENTS.md from the root', async () => {
    const base = repo();
    writeFileSync(path.join(base, 'AGENTS.md'), '# Rules\nUse tabs.\n');
    const res = await load_project_context({ path: base });
    expect(res.output).toContain('Use tabs.');
    expect(res.output).toContain('AUTHORITATIVE');
  });

  it('prefers AGENTS.md over CLAUDE.md in the same dir (no double-loading)', async () => {
    const base = repo();
    writeFileSync(path.join(base, 'AGENTS.md'), 'AGENTS rules\n');
    writeFileSync(path.join(base, 'CLAUDE.md'), 'CLAUDE rules\n');
    const res = await load_project_context({ path: base });
    expect(res.output).toContain('AGENTS rules');
    expect(res.output).not.toContain('CLAUDE rules');
  });

  it('cascades from the root down to a nested dir', async () => {
    const base = repo();
    writeFileSync(path.join(base, 'AGENTS.md'), 'root rules\n');
    writeFileSync(path.join(base, 'pkg', 'AGENTS.md'), 'pkg rules\n');
    const res = await load_project_context({ path: path.join(base, 'pkg') });
    expect(res.output).toContain('root rules');
    expect(res.output).toContain('pkg rules');
    // Outermost first, so the nearer file appends last and effectively wins.
    expect(res.output.indexOf('root rules')).toBeLessThan(res.output.indexOf('pkg rules'));
  });

  it('inlines an @-import (the CLAUDE.md → AGENTS.md convention)', async () => {
    const base = repo();
    writeFileSync(path.join(base, 'CLAUDE.md'), 'Preamble\n@AGENTS.md\n');
    writeFileSync(path.join(base, 'AGENTS.md'), 'IMPORTED BODY\n');
    // Only CLAUDE.md exists as a chosen file if AGENTS.md is absent; here both
    // exist so AGENTS.md wins directly — assert the import path via a subdir.
    mkdirSync(path.join(base, 'sub'));
    writeFileSync(path.join(base, 'sub', 'CLAUDE.md'), 'Sub preamble\n@../AGENTS.md\n');
    const res = await load_project_context({ path: path.join(base, 'sub') });
    expect(res.output).toContain('IMPORTED BODY');
  });

  it('does not follow an @-import outside the authorized roots', async () => {
    const base = repo();
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    writeFileSync(path.join(outside, 'secret.md'), 'LEAKED');
    writeFileSync(path.join(base, 'AGENTS.md'), `@${path.join(outside, 'secret.md')}\n`);
    const res = await load_project_context({ path: base });
    expect(res.output).not.toContain('LEAKED');
  });

  it('survives a circular import instead of recursing forever', async () => {
    const base = repo();
    mkdirSync(path.join(base, 'sub'));
    writeFileSync(path.join(base, 'sub', 'CLAUDE.md'), '@../a.md\n');
    writeFileSync(path.join(base, 'a.md'), 'A body\n@b.md\n');
    writeFileSync(path.join(base, 'b.md'), 'B body\n@a.md\n');
    const res = await load_project_context({ path: path.join(base, 'sub') });
    expect(res.output).toContain('A body');
    expect(res.output).toContain('B body');
    expect(res.output).toContain('circular import');
  });

  it('lists project slash commands with descriptions', async () => {
    const base = repo();
    mkdirSync(path.join(base, '.claude', 'commands'), { recursive: true });
    writeFileSync(path.join(base, '.claude', 'commands', 'deploy.md'), '# Deploy\nShip to production.\n');
    const res = await load_project_context({ path: base });
    expect(res.output).toContain('/deploy');
    expect(res.output).toContain('Ship to production.');
  });

  it('finds root-level commands from a nested dir', async () => {
    const base = repo();
    mkdirSync(path.join(base, '.claude', 'commands'), { recursive: true });
    writeFileSync(path.join(base, '.claude', 'commands', 'deploy.md'), 'Ship it.\n');
    writeFileSync(path.join(base, 'AGENTS.md'), 'rules\n');
    const res = await load_project_context({ path: path.join(base, 'pkg') });
    expect(res.output).toContain('/deploy');
  });

  it('accepts a file path and resolves it to its directory', async () => {
    const base = repo();
    writeFileSync(path.join(base, 'AGENTS.md'), 'rules here\n');
    const f = path.join(base, 'pkg', 'x.ts');
    writeFileSync(f, 'x');
    const res = await load_project_context({ path: f });
    expect(res.output).toContain('rules here');
  });

  it('reports plainly when a project has no conventions', async () => {
    const base = repo();
    const res = await load_project_context({ path: base });
    expect(res.output).toContain('no project context found');
  });

  it('rejects a path outside the authorized roots', async () => {
    repo();
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    await expect(load_project_context({ path: outside })).rejects.toThrow('path outside allowed roots');
  });

  it('errors clearly when no roots are authorized', async () => {
    _resetRootsForTesting();
    await expect(load_project_context({})).rejects.toThrow('no authorized roots');
  });

  it('does not walk above the authorized root', async () => {
    const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-ctx-')));
    const inner = path.join(base, 'inner');
    mkdirSync(inner);
    // A convention file ABOVE the root must not be picked up.
    writeFileSync(path.join(base, 'AGENTS.md'), 'ABOVE ROOT');
    writeFileSync(path.join(inner, 'AGENTS.md'), 'inner rules');
    setRoots([inner]);
    const res = await load_project_context({ path: inner });
    expect(res.output).toContain('inner rules');
    expect(res.output).not.toContain('ABOVE ROOT');
  });
});
