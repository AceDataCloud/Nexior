import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import { resolveEnhancedPath } from './env';
import { assertInRoots, expandHome } from './fs';
import { getWorkingDir } from './config';
import type { ToolResult } from './types';

// A persistent shell per conversation, so `cd`, activated virtualenvs, exported
// vars and started background processes SURVIVE between tool calls. `execFile`
// (shell.run_command) spawns a fresh process every time, which makes the most
// ordinary coding sequence — cd into the repo, install, run the dev server —
// impossible to express.
//
// The working directory doubles as the session's "current project": it is what
// project.load_context defaults to, and what a relative path resolves against.

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // reap a shell nobody has used
const DEFAULT_COMMAND_TIMEOUT_MS = 120_000;
const MAX_OUTPUT_CHARS = 200_000;

interface Session {
  proc: ChildProcessWithoutNullStreams;
  cwd: string;
  buffer: string;
  busy: boolean;
  lastUsed: number;
  timer: NodeJS.Timeout | null;
  // Set after a timeout: the killed command's sentinel echo may still be queued
  // in the shell, so the next run must drain stale output before trusting it.
  needsResync: boolean;
}

const sessions = new Map<string, Session>();

/** A marker the shell echoes after each command so we know where output ends
 *  and can read back the exit code + the (possibly changed) cwd. Includes a
 *  random token so command output that happens to contain the word can't be
 *  mistaken for the real sentinel. */
function makeSentinel(): string {
  return `__ACE_DONE_${Math.random().toString(36).slice(2, 10)}__`;
}

function shellPath(): { cmd: string; args: string[] } {
  if (process.platform === 'win32') {
    return { cmd: process.env.COMSPEC || 'cmd.exe', args: ['/Q', '/K'] };
  }
  // A LOGIN shell would source the user's rc files and could hang on an
  // interactive prompt; a plain interactive-less bash keeps startup predictable.
  return { cmd: process.env.SHELL || '/bin/bash', args: [] };
}

async function spawnSession(cwd: string): Promise<Session> {
  const enhancedPath = await resolveEnhancedPath();
  const { cmd, args } = shellPath();
  const proc = spawn(cmd, args, {
    cwd,
    env: {
      // Same allowlist rationale as shell.run_command: never hand the model's
      // commands the app's own tokens. PATH is the enhanced one so node/npm/uv
      // resolve under a Dock launch.
      PATH: enhancedPath,
      HOME: process.env.HOME,
      LANG: process.env.LANG,
      TERM: 'dumb', // no ANSI escapes to strip out of the transcript
      SystemRoot: process.env.SystemRoot
    },
    stdio: ['pipe', 'pipe', 'pipe']
  }) as ChildProcessWithoutNullStreams;

  const s: Session = {
    proc,
    cwd,
    buffer: '',
    busy: false,
    lastUsed: Date.now(),
    timer: null,
    needsResync: false
  };
  proc.stdout.on('data', (d: Buffer) => {
    s.buffer += d.toString('utf8');
  });
  proc.stderr.on('data', (d: Buffer) => {
    s.buffer += d.toString('utf8');
  });
  // A shell that dies (user killed it, OOM) must not leave a stale entry that
  // every later call writes into a closed pipe.
  proc.on('exit', () => {
    for (const [k, v] of sessions) if (v === s) sessions.delete(k);
  });
  return s;
}

function touch(key: string, s: Session): void {
  s.lastUsed = Date.now();
  if (s.timer) clearTimeout(s.timer);
  s.timer = setTimeout(() => {
    sessions.delete(key);
    s.proc.kill();
  }, IDLE_TIMEOUT_MS);
  s.timer.unref?.();
}

/** Resolve + authorize a working directory. Must be inside an authorized root:
 *  a persistent shell in an unauthorized folder would be a hole straight
 *  through the fs boundary. */
function resolveCwd(dir: string): string {
  return assertInRoots(expandHome(dir));
}

/** The configured working directory, or a clear error. The desktop chat page
 *  blocks sending until one is chosen, so this should be unreachable in
 *  practice — it exists so a tool call can never silently open a shell
 *  somewhere the user did not choose. */
function requireWorkingDir(): string {
  const wd = getWorkingDir();
  if (!wd) throw new Error('no working directory set — choose a project folder first');
  return wd;
}

async function getSession(key: string, cwd?: string): Promise<Session> {
  const existing = sessions.get(key);
  if (existing && !existing.proc.killed) {
    if (cwd) {
      const target = resolveCwd(cwd);
      if (target !== existing.cwd) {
        await runIn(existing, `cd ${quote(target)}`, DEFAULT_COMMAND_TIMEOUT_MS);
        existing.cwd = target;
      }
    }
    touch(key, existing);
    return existing;
  }
  // No explicit cwd: start in the user's chosen working directory. It used to
  // fall back to `os.homedir()`, which BYPASSED resolveCwd — so a shell could
  // be spawned in a folder that was never authorized (home usually isn't).
  const start = resolveCwd(cwd ?? requireWorkingDir());
  const s = await spawnSession(start);
  sessions.set(key, s);
  touch(key, s);
  return s;
}

function quote(s: string): string {
  if (process.platform === 'win32') return `"${s.replace(/"/g, '""')}"`;
  return `'${s.replace(/'/g, `'\\''`)}'`;
}

/** Kill the shell's child processes (the command that is currently running)
 *  WITHOUT killing the shell itself. `pkill -P <pid>` targets children by
 *  parent pid; on Windows `taskkill /T` without `/F` on the child list is not
 *  available, so we fall back to killing the whole tree there (Windows has no
 *  persistent-shell state guarantee to protect in that path). */
function killChildren(pid: number | undefined): void {
  if (!pid) return;
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
      return;
    }
    // SIGTERM first (lets a well-behaved child clean up); a stubborn child is
    // then removed with SIGKILL a moment later.
    spawn('pkill', ['-TERM', '-P', String(pid)], { stdio: 'ignore' });
    setTimeout(() => {
      try {
        spawn('pkill', ['-KILL', '-P', String(pid)], { stdio: 'ignore' });
      } catch {
        /* the child already exited */
      }
    }, 500).unref?.();
  } catch {
    /* best effort: a timeout that can't kill the child still returns to caller */
  }
}

/** Write one command to the shell and read until its sentinel appears. */
function runIn(s: Session, command: string, timeoutMs: number): Promise<{ output: string; code: number | null }> {
  if (s.busy) return Promise.resolve({ output: '[shell busy with another command]', code: null });
  s.busy = true;
  // Drop anything the previous (killed) command left in flight. Sentinels are
  // per-call random, so a stale one can never be mistaken for this call's — but
  // its raw output would still be prepended to ours.
  s.buffer = '';
  s.needsResync = false;
  const sentinel = makeSentinel();
  // `echo <sentinel> <exit code> <pwd>` after the command: one line that tells
  // us the command finished, whether it succeeded, and where the shell now is.
  const line =
    process.platform === 'win32'
      ? `${command}\r\necho ${sentinel} %ERRORLEVEL% %CD%\r\n`
      : `${command}\necho ${sentinel} $? "$PWD"\n`;

  return new Promise((resolve) => {
    let done = false;
    const finish = (output: string, code: number | null) => {
      if (done) return;
      done = true;
      clearInterval(poll);
      clearTimeout(timer);
      s.busy = false;
      resolve({ output, code });
    };
    const timer = setTimeout(() => {
      // Kill the RUNNING COMMAND, not the shell. Signalling the shell directly
      // would terminate it (a non-interactive bash exits on SIGINT), throwing
      // away the cwd and every exported var the session accumulated — exactly
      // the state this whole module exists to preserve. `detached: true` put
      // the shell in its own process group, so a negative pid signals the group
      // (shell + its children); we instead enumerate and kill only the
      // children, leaving the shell itself untouched.
      killChildren(s.proc.pid);
      // The interrupted command's `echo <sentinel>` line is still queued in the
      // shell; without draining it, the NEXT command would read that stale
      // sentinel and return immediately with the wrong output. Mark the session
      // so the next run resynchronises.
      s.needsResync = true;
      finish(s.buffer + `\n[timed out after ${Math.round(timeoutMs / 1000)}s; shell kept alive]`, null);
    }, timeoutMs);
    timer.unref?.();

    const poll = setInterval(() => {
      const idx = s.buffer.indexOf(sentinel);
      if (idx < 0) {
        if (s.buffer.length > MAX_OUTPUT_CHARS) {
          s.proc.kill('SIGINT');
          finish(s.buffer.slice(0, MAX_OUTPUT_CHARS) + '\n[output truncated]', null);
        }
        return;
      }
      const before = s.buffer.slice(0, idx);
      const rest = s.buffer.slice(idx + sentinel.length);
      const eol = rest.indexOf('\n');
      if (eol < 0) return; // sentinel line not fully arrived yet
      const tail = rest.slice(0, eol).trim();
      const [codeStr, ...pwdParts] = tail.split(/\s+/);
      const pwd = pwdParts.join(' ').replace(/^"|"$/g, '');
      if (pwd) s.cwd = pwd;
      finish(before, Number.isFinite(Number(codeStr)) ? Number(codeStr) : null);
    }, 25);

    s.proc.stdin.write(line);
  });
}

/**
 * Run a command in the conversation's persistent shell. State (cwd, env,
 * background jobs) survives across calls.
 */
export async function shell_exec(i: {
  command: string;
  cwd?: string;
  timeout_ms?: number;
  sessionId?: string;
}): Promise<ToolResult> {
  if (!i.command || !i.command.trim()) throw new Error('command is required');
  const key = i.sessionId || 'default';
  const s = await getSession(key, i.cwd);
  const timeoutMs = Math.min(Math.max(1000, i.timeout_ms ?? DEFAULT_COMMAND_TIMEOUT_MS), 600_000);
  const { output, code } = await runIn(s, i.command, timeoutMs);
  touch(key, s);
  const trimmed = output.replace(/\s+$/, '');
  const footer = `\n[cwd: ${s.cwd}${code === null ? '' : ` | exit ${code}`}]`;
  return { output: (trimmed || '(no output)') + footer, is_error: code !== null && code !== 0 };
}

/** Read or set the session's working directory (the "current project"). */
export async function set_working_dir(i: { path?: string; sessionId?: string }): Promise<ToolResult> {
  const key = i.sessionId || 'default';
  if (!i.path) {
    // No live shell yet → report the configured project directory rather than
    // the home dir, which is what the next `shell.exec` would actually use.
    const s = sessions.get(key);
    return { output: s ? s.cwd : (getWorkingDir() ?? '(no working directory set)') };
  }
  const target = resolveCwd(i.path);
  const s = await getSession(key, target);
  return { output: `working directory: ${s.cwd}` };
}

/** The session's current working directory, for other tools that default to
 *  "the project I'm working in" (e.g. project.load_context). Null when the
 *  conversation has not started a shell / set a directory yet. */
export function currentWorkingDir(sessionId?: string): string | null {
  const s = sessions.get(sessionId || 'default');
  return s ? s.cwd : null;
}

/** Terminate a conversation's shell (called when its window/session ends). */
export function endSession(sessionId: string): void {
  const s = sessions.get(sessionId);
  if (!s) return;
  if (s.timer) clearTimeout(s.timer);
  sessions.delete(sessionId);
  s.proc.kill();
}

export function _resetSessionsForTesting(): void {
  for (const [k, s] of sessions) {
    if (s.timer) clearTimeout(s.timer);
    s.proc.kill();
    sessions.delete(k);
  }
}

// Exposed for tests that need a deterministic path helper.
export const _internal = { quote, resolveCwd, sessionsSize: () => sessions.size, pathSep: path.sep };
