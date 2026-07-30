import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// A GUI-launched Electron app (Finder / Dock / Start menu) inherits a stripped
// PATH — it does NOT source the user's shell profile — so `npx` / `node` /
// `uvx` / `bunx` (in Homebrew, nvm, ~/.local, bun) resolve to `spawn ENOENT`.
// On macOS `launchctl getenv PATH` is typically empty, leaving only
// /usr/bin:/bin:/usr/sbin:/sbin — enough for `git`/`python3`, not for
// node/npm/brew. Shared by the MCP host and `shell.run_command` so both resolve
// commands the same way. Rebuilt once, cached (as a Promise) for the process
// lifetime. ASYNC so the login-shell probe never blocks the main thread / UI.

// Standard Node + global-npm install dirs on Windows, derived from STABLE env
// vars (never the possibly-stale inherited PATH). Exported for tests.
export function windowsNodeDirs(env: NodeJS.ProcessEnv = process.env): string[] {
  return [
    env.ProgramFiles && `${env.ProgramFiles}\\nodejs`,
    env['ProgramFiles(x86)'] && `${env['ProgramFiles(x86)']}\\nodejs`,
    env.APPDATA && `${env.APPDATA}\\npm`,
    env.LOCALAPPDATA && `${env.LOCALAPPDATA}\\Programs\\nodejs`
  ].filter((d): d is string => !!d);
}

let cachedPath: Promise<string> | null = null;

export function resolveEnhancedPath(): Promise<string> {
  if (cachedPath) return cachedPath;
  cachedPath = (async (): Promise<string> => {
    const sep = process.platform === 'win32' ? ';' : ':';
    let parts = (process.env.PATH || '').split(sep);
    if (process.platform !== 'win32') {
      // Ask the user's login shell for its real PATH (covers nvm / asdf / brew /
      // bun). Bounded by a short timeout + static fallback so a slow or noisy
      // shell can't wedge startup; take the last non-empty line.
      try {
        const shell = process.env.SHELL || '/bin/zsh';
        const { stdout } = await execFileAsync(shell, ['-lic', 'printf "%s" "$PATH"'], { timeout: 3000, encoding: 'utf8' });
        const line = stdout.trim().split('\n').filter(Boolean).pop() || '';
        if (line.includes('/')) parts = line.split(sep).concat(parts);
      } catch {
        /* login shell unavailable — fall back to the static dirs below */
      }
      const home = process.env.HOME || '';
      parts = parts.concat(['/opt/homebrew/bin', '/usr/local/bin', '/usr/bin', '/bin', `${home}/.local/bin`, `${home}/.bun/bin`]);
    } else {
      // A GUI-launched Windows app can inherit a STALE PATH — e.g. an
      // explorer.exe started before Node was installed (or before its installer
      // updated the registry PATH) — so a bare `node` / `npx` resolves to
      // `spawn ENOENT` even though Node IS installed and on the machine PATH.
      // Append the standard Node + global-npm install dirs so the common install
      // still resolves. Bare-command resolution tolerates the space in
      // "Program Files".
      parts = parts.concat(windowsNodeDirs());
    }
    const seen = new Set<string>();
    return parts.filter((d) => d && !seen.has(d) && seen.add(d)).join(sep);
  })();
  return cachedPath;
}

// Test hook: drop the cached PATH so a case can re-probe with a different env.
export function _resetPathCacheForTesting(): void {
  cachedPath = null;
}
