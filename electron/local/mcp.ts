import { spawn, execFile, ChildProcess } from 'node:child_process';
import { promisify } from 'node:util';
import type { McpServerConf, ToolSpec, ToolResult } from './types';

const execFileAsync = promisify(execFile);
const RPC_TIMEOUT_MS = 30_000;

interface Pending { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout; }

// A GUI-launched Electron app (Finder / Dock / Start menu) inherits a stripped
// PATH — it does NOT source the user's shell profile — so `npx` / `node` /
// `uvx` / `bunx` (in Homebrew, nvm, ~/.local, bun) resolve to `spawn ENOENT`
// and every MCP server silently fails to connect. Rebuild a usable PATH once,
// cached (as a Promise) for the process lifetime. ASYNC so the login-shell
// probe never blocks the main thread / UI.
let cachedPath: Promise<string> | null = null;
function resolveEnhancedPath(): Promise<string> {
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
    }
    const seen = new Set<string>();
    return parts.filter((d) => d && !seen.has(d) && seen.add(d)).join(sep);
  })();
  return cachedPath;
}

// Spawns local stdio MCP servers and bridges tools/list + tools/call.
// Newline-delimited JSON-RPC with partial-line buffering; notifications (no id)
// are ignored; outstanding calls time out so a wedged server can't hang a turn.
export class McpHost {
  private procs = new Map<string, ChildProcess>();
  private seq = 0;
  private pending = new Map<number, Pending>();
  // Last ~2KB of stderr per server id, so a failed start can report WHY.
  private stderrTail = new Map<string, string>();

  async start(c: McpServerConf): Promise<void> {
    const isWin = process.platform === 'win32';
    const enhancedPath = await resolveEnhancedPath();
    const p = spawn(c.command, c.args, {
      cwd: c.cwd,
      // Spread the full env (MCP servers expect HOME/USER/etc.), let the server
      // conf override, then force our resolved PATH last.
      env: { ...process.env, ...c.env, PATH: enhancedPath },
      stdio: ['pipe', 'pipe', 'pipe'],
      // Windows: `npx`/`node` are `.cmd` shims that only resolve via a shell.
      shell: isWin,
      windowsHide: true
    });
    this.procs.set(c.id, p);
    this.stderrTail.set(c.id, '');
    p.stderr?.on('data', (chunk: Buffer) => {
      this.stderrTail.set(c.id, ((this.stderrTail.get(c.id) ?? '') + chunk.toString()).slice(-2000));
    });
    // spawn failures (ENOENT for a missing command, EACCES, …) arrive as an
    // 'error' event, NOT a throw — race it against initialize so a bad command
    // rejects start() promptly instead of hanging until the rpc timeout.
    const spawnError = new Promise<never>((_, reject) => {
      p.once('error', (e: Error) => reject(new Error(`spawn ${c.command}: ${e.message}`)));
    });
    let buf = '';
    p.stdout.on('data', (chunk: Buffer) => {
      buf += chunk.toString();
      let nl: number;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line) continue;
        try {
          const m = JSON.parse(line) as { id?: number; result?: unknown; error?: unknown };
          if (m.id == null) continue; // notification
          const w = this.pending.get(m.id);
          if (!w) continue;
          this.pending.delete(m.id);
          clearTimeout(w.timer);
          m.error ? w.reject(new Error(JSON.stringify(m.error))) : w.resolve(m.result);
        } catch {
          /* skip malformed line */
        }
      }
    });
    p.on('exit', () => {
      // Only forget this proc if it's still the one we tracked. On reboot()
      // stopAll() kills the old proc, then boot() spawns a new one under the
      // same id; the old proc's async exit must NOT delete the new entry.
      if (this.procs.get(c.id) === p) this.procs.delete(c.id);
    });
    try {
      await Promise.race([
        this.rpc(c.id, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'nexior', version: '1' } }),
        spawnError
      ]);
    } catch (e) {
      // Fold the stderr tail into the error so the Settings row can show a real
      // reason (npm 404, python traceback, "command not found", …).
      const tail = (this.stderrTail.get(c.id) ?? '').trim().split('\n').slice(-3).join(' ');
      throw new Error((e instanceof Error ? e.message : String(e)) + (tail ? ` — ${tail}` : ''));
    }
  }

  private rpc(server: string, method: string, params: unknown): Promise<unknown> {
    const proc = this.procs.get(server);
    if (!proc?.stdin) return Promise.reject(new Error(`mcp ${server} not running`));
    const id = ++this.seq;
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('mcp rpc timeout')); }, RPC_TIMEOUT_MS);
      this.pending.set(id, { resolve, reject, timer });
    });
  }

  async listTools(server: string): Promise<ToolSpec[]> {
    const r = (await this.rpc(server, 'tools/list', {})) as { tools?: { name: string; description?: string; inputSchema?: Record<string, unknown> }[] };
    return (r.tools ?? []).map((t) => ({
      name: `mcp.${server}.${t.name}`,
      description: t.description ?? '',
      input_schema: t.inputSchema ?? {},
      source: 'mcp' as const,
      mutates: true
    }));
  }

  async call(server: string, tool: string, input: Record<string, unknown>): Promise<ToolResult> {
    const r = (await this.rpc(server, 'tools/call', { name: tool, arguments: input })) as { content?: unknown; isError?: boolean };
    return { output: JSON.stringify(r.content ?? ''), is_error: !!r.isError };
  }

  stopAll(): void {
    this.procs.forEach((p) => p.kill());
    this.procs.clear();
  }

  // Kill one server's process (used by targeted reconnect).
  stop(id: string): void {
    const p = this.procs.get(id);
    if (p) {
      p.kill();
      this.procs.delete(id);
    }
  }
}
