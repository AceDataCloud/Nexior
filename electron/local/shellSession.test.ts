import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, realpathSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// shellSession reads the working directory from config.ts, which reads
// `app.getPath('userData')`; point it at a per-test temp dir.
const state = vi.hoisted(() => ({ userData: '' }));
vi.mock('electron', () => ({ app: { getPath: () => state.userData } }));

import { setRoots, _resetRootsForTesting } from './fs';
import { shell_exec, set_working_dir, currentWorkingDir, endSession, _resetSessionsForTesting } from './shellSession';

const WIN = process.platform === 'win32';

function rooted() {
  const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-sh-')));
  mkdirSync(path.join(base, 'sub'));
  setRoots([base]);
  return base;
}

// Each case spawns a real shell and waits for round-trips, so these are
// sensitive to machine load when the full suite runs in parallel. 5s (the
// vitest default) is not enough headroom on a busy CI box.
describe.skipIf(WIN)('shell.exec persistent session', { timeout: 20_000 }, () => {
  afterEach(() => {
    _resetSessionsForTesting();
    _resetRootsForTesting();
  });

  it('keeps the working directory across calls (cd persists)', async () => {
    const base = rooted();
    // The first call must name a cwd (or a working directory must be
    // configured) — a shell is never spawned in an unauthorized folder.
    await shell_exec({ command: 'cd sub', cwd: base, sessionId: 's1' });
    const res = await shell_exec({ command: 'pwd', sessionId: 's1' });
    expect(res.output).toContain(path.join(base, 'sub'));
  });

  it('keeps exported variables across calls', async () => {
    const base = rooted();
    await shell_exec({ command: 'export ACE_TEST=hello', cwd: base, sessionId: 's2' });
    const res = await shell_exec({ command: 'echo "$ACE_TEST"', sessionId: 's2' });
    expect(res.output).toContain('hello');
  });

  it('isolates sessions from each other', async () => {
    const base = rooted();
    await shell_exec({ command: 'export ACE_ONLY_A=1', cwd: base, sessionId: 'a' });
    const res = await shell_exec({ command: 'echo "[${ACE_ONLY_A:-unset}]"', cwd: base, sessionId: 'b' });
    expect(res.output).toContain('[unset]');
  });

  it('reports a non-zero exit as a tool error', async () => {
    const base = rooted();
    // NOT `exit 3` — that would terminate the persistent shell itself. A failing
    // command is the realistic case (a build that breaks, a missing file).
    const res = await shell_exec({ command: 'ls /definitely/not/here', cwd: base, sessionId: 's3' });
    expect(res.is_error).toBe(true);
  });

  it('a failing command does not kill the session', async () => {
    const base = rooted();
    await shell_exec({ command: 'export ACE_ALIVE=1', cwd: base, sessionId: 's3b' });
    await shell_exec({ command: 'false', sessionId: 's3b' });
    const res = await shell_exec({ command: 'echo "$ACE_ALIVE"', sessionId: 's3b' });
    expect(res.output).toContain('1');
  });

  it('surfaces the cwd in the footer so the model always knows where it is', async () => {
    const base = rooted();
    const res = await shell_exec({ command: 'echo hi', cwd: base, sessionId: 's4' });
    expect(res.output).toContain('hi');
    expect(res.output).toContain(`[cwd: ${base}`);
  });

  it('rejects a working directory outside the authorized roots', async () => {
    rooted();
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    await expect(shell_exec({ command: 'echo x', cwd: outside, sessionId: 's5' })).rejects.toThrow(
      'path outside allowed roots'
    );
  });

  it('survives a command timeout with the session state intact', async () => {
    const base = rooted();
    await shell_exec({ command: 'export ACE_KEEP=yes', cwd: base, sessionId: 's6' });
    const slow = await shell_exec({ command: 'sleep 5', timeout_ms: 1000, sessionId: 's6' });
    expect(slow.output).toContain('timed out');
    // The shell must NOT have been killed — the exported var is still there.
    const after = await shell_exec({ command: 'echo "$ACE_KEEP"', sessionId: 's6' });
    expect(after.output).toContain('yes');
  });

  it('handles a directory containing spaces and quotes', async () => {
    const base = rooted();
    const odd = path.join(base, "we'ird dir");
    mkdirSync(odd);
    const res = await shell_exec({ command: 'pwd', cwd: odd, sessionId: 's7' });
    expect(res.output).toContain(odd);
  });

  it('endSession terminates the shell so state does not leak to a new one', async () => {
    const base = rooted();
    await shell_exec({ command: 'export ACE_GONE=1', cwd: base, sessionId: 's8' });
    endSession('s8');
    const res = await shell_exec({ command: 'echo "[${ACE_GONE:-unset}]"', cwd: base, sessionId: 's8' });
    expect(res.output).toContain('[unset]');
  });
});

describe.skipIf(WIN)('shell.set_working_dir', () => {
  afterEach(() => {
    _resetSessionsForTesting();
    _resetRootsForTesting();
  });

  it('sets the directory and makes it readable by currentWorkingDir', async () => {
    const base = rooted();
    const res = await set_working_dir({ path: base, sessionId: 'w1' });
    expect(res.output).toContain(base);
    expect(currentWorkingDir('w1')).toBe(base);
  });

  it('reads back the current directory when path is omitted', async () => {
    const base = rooted();
    await set_working_dir({ path: base, sessionId: 'w2' });
    const res = await set_working_dir({ sessionId: 'w2' });
    expect(res.output).toBe(base);
  });

  it('rejects a directory outside the authorized roots', async () => {
    rooted();
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    await expect(set_working_dir({ path: outside, sessionId: 'w3' })).rejects.toThrow('path outside allowed roots');
  });

  it('a subsequent shell.exec runs in the directory that was set', async () => {
    const base = rooted();
    await set_working_dir({ path: path.join(base, 'sub'), sessionId: 'w4' });
    const res = await shell_exec({ command: 'pwd', sessionId: 'w4' });
    expect(res.output).toContain(path.join(base, 'sub'));
  });

  it('currentWorkingDir is null before any directory is set', () => {
    rooted();
    expect(currentWorkingDir('never-used')).toBeNull();
  });
});

// project.load_context defaulting to the session working directory is the whole
// point of pairing it with this PR — verify the wiring, not just the tool.
describe.skipIf(WIN)('project.load_context defaults to the working directory', () => {
  afterEach(() => {
    _resetSessionsForTesting();
    _resetRootsForTesting();
  });

  it('loads the conventions of the project the session is working in', async () => {
    const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-multi-')));
    const projA = path.join(base, 'projA');
    const projB = path.join(base, 'projB');
    mkdirSync(projA);
    mkdirSync(projB);
    writeFileSync(path.join(projA, 'AGENTS.md'), 'RULES OF A\n');
    writeFileSync(path.join(projB, 'AGENTS.md'), 'RULES OF B\n');
    setRoots([projA, projB]);

    const { load_project_context } = await import('./context');
    // Working in B must load B's rules, not whichever root was added first.
    await set_working_dir({ path: projB, sessionId: 'ctx1' });
    const res = await load_project_context({ sessionId: 'ctx1' });
    expect(res.output).toContain('RULES OF B');
    expect(res.output).not.toContain('RULES OF A');
  });

  it('refuses to guess when several projects are authorized and no cwd is set', async () => {
    const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-multi-')));
    const a = path.join(base, 'a');
    const b = path.join(base, 'b');
    mkdirSync(a);
    mkdirSync(b);
    setRoots([a, b]);
    const { load_project_context } = await import('./context');
    await expect(load_project_context({ sessionId: 'ctx2' })).rejects.toThrow('no working directory set');
  });

  it('uses the single authorized root when there is no ambiguity', async () => {
    const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-one-')));
    writeFileSync(path.join(base, 'AGENTS.md'), 'ONLY RULES\n');
    setRoots([base]);
    const { load_project_context } = await import('./context');
    const res = await load_project_context({ sessionId: 'ctx3' });
    expect(res.output).toContain('ONLY RULES');
  });
});

// The configured working directory is what the user picked in the app. These
// cover the config → tool wiring, which is the whole point of this change.
describe.skipIf(WIN)('configured working directory', () => {
  const userDataDirs: string[] = [];

  /** Point config.ts at a temp userData dir holding the given working dir. */
  function configureWorkingDir(dir: string): void {
    const d = mkdtempSync(path.join(os.tmpdir(), 'nx-wdcfg-'));
    userDataDirs.push(d);
    state.userData = d;
    writeFileSync(path.join(d, 'local-tools.json'), JSON.stringify({ roots: [], mcp: [], workingDir: dir }));
  }

  afterEach(() => {
    _resetSessionsForTesting();
    _resetRootsForTesting();
    for (const d of userDataDirs.splice(0)) rmSync(d, { recursive: true, force: true });
    state.userData = '';
  });

  it('is where a shell starts when the model passes no cwd', async () => {
    const base = rooted();
    configureWorkingDir(base);
    const res = await shell_exec({ command: 'pwd', sessionId: 'cw1' });
    expect(res.output).toContain(base);
  });

  // Regression: the fallback used to be `os.homedir()`, which ALSO bypassed the
  // roots check — a shell could be spawned in a folder that was never
  // authorized. It must fail loudly instead.
  it('refuses to start a shell when none is set, rather than falling back to $HOME', async () => {
    rooted();
    configureWorkingDir(''); // config present, but no working directory
    await expect(shell_exec({ command: 'pwd', sessionId: 'cw2' })).rejects.toThrow('no working directory set');
  });

  it('still enforces the roots boundary on the configured directory', async () => {
    rooted(); // authorizes some OTHER folder
    const outside = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-out-')));
    configureWorkingDir(outside);
    await expect(shell_exec({ command: 'pwd', sessionId: 'cw3' })).rejects.toThrow('path outside allowed roots');
  });

  it('is reported by set_working_dir before any shell has started', async () => {
    const base = rooted();
    configureWorkingDir(base);
    const res = await set_working_dir({ sessionId: 'cw4' });
    expect(res.output).toBe(base);
  });

  it('is where project.load_context looks when the session has no shell yet', async () => {
    const base = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-ctxcfg-')));
    writeFileSync(path.join(base, 'AGENTS.md'), 'CONFIGURED PROJECT RULES\n');
    const other = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'nx-other-')));
    writeFileSync(path.join(other, 'AGENTS.md'), 'OTHER RULES\n');
    // Two authorized roots — ambiguous without a working directory.
    setRoots([other, base]);
    configureWorkingDir(base);
    const { load_project_context } = await import('./context');
    const res = await load_project_context({ sessionId: 'cw5' });
    expect(res.output).toContain('CONFIGURED PROJECT RULES');
    expect(res.output).not.toContain('OTHER RULES');
  });

  it('yields to the session shell once the model has cd\'d elsewhere', async () => {
    const base = rooted();
    writeFileSync(path.join(base, 'AGENTS.md'), 'ROOT RULES\n');
    writeFileSync(path.join(base, 'sub', 'AGENTS.md'), 'SUB RULES\n');
    configureWorkingDir(base);
    await set_working_dir({ path: path.join(base, 'sub'), sessionId: 'cw6' });
    const { load_project_context } = await import('./context');
    const res = await load_project_context({ sessionId: 'cw6' });
    // Both appear (conventions cascade), but the live session dir is the leaf.
    expect(res.output).toContain('SUB RULES');
  });
});
