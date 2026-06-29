import { execFile } from 'node:child_process';
import type { ToolResult } from './types';

// NO sandbox by design (user's own machine; gated by consent + visibility).
// execFile with argv (never a shell string) avoids injection; env is an
// explicit allowlist so local tokens/API keys never leak to AI-run commands.
export function run_command(i: { cmd: string; args?: string[]; cwd?: string }, timeoutMs = 120_000): Promise<ToolResult> {
  return new Promise((resolve) => {
    execFile(
      i.cmd,
      i.args ?? [],
      {
        cwd: i.cwd,
        timeout: timeoutMs,
        maxBuffer: 8_000_000,
        env: { PATH: process.env.PATH, HOME: process.env.HOME, LANG: process.env.LANG, SystemRoot: process.env.SystemRoot }
      },
      (err, stdout, stderr) => resolve({ output: (stdout || '') + (stderr || ''), is_error: !!err })
    );
  });
}
