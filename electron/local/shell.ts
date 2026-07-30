import { execFile } from 'node:child_process';
import { resolveEnhancedPath } from './env';
import type { ToolResult } from './types';

// NO sandbox by design (user's own machine; gated by consent + visibility).
// execFile with argv (never a shell string) avoids injection; env is an
// explicit allowlist so local tokens/API keys never leak to AI-run commands.
// PATH comes from resolveEnhancedPath(), not the inherited one: a Dock/Finder
// launch inherits a stripped PATH (launchctl's is empty on macOS), which left
// `node`/`npm`/`brew`/`uv` at ENOENT while `git`/`python3` in /usr/bin worked.
// Same resolution the MCP host uses.
export async function run_command(
  i: { cmd: string; args?: string[]; cwd?: string },
  timeoutMs = 120_000
): Promise<ToolResult> {
  const path = await resolveEnhancedPath();
  return new Promise((resolve) => {
    execFile(
      i.cmd,
      i.args ?? [],
      {
        cwd: i.cwd,
        timeout: timeoutMs,
        maxBuffer: 8_000_000,
        env: { PATH: path, HOME: process.env.HOME, LANG: process.env.LANG, SystemRoot: process.env.SystemRoot }
      },
      (err, stdout, stderr) => resolve({ output: (stdout || '') + (stderr || ''), is_error: !!err })
    );
  });
}
