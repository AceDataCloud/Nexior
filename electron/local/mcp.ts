import { spawn, ChildProcess } from 'node:child_process';
import type { McpServerConf, ToolSpec, ToolResult } from './types';

const RPC_TIMEOUT_MS = 30_000;

interface Pending { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout; }

// Spawns local stdio MCP servers and bridges tools/list + tools/call.
// Newline-delimited JSON-RPC with partial-line buffering; notifications (no id)
// are ignored; outstanding calls time out so a wedged server can't hang a turn.
export class McpHost {
  private procs = new Map<string, ChildProcess>();
  private seq = 0;
  private pending = new Map<number, Pending>();

  async start(c: McpServerConf): Promise<void> {
    const p = spawn(c.command, c.args, {
      cwd: c.cwd,
      env: { ...c.env, PATH: process.env.PATH },
      stdio: ['pipe', 'pipe', 'inherit']
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
    this.procs.set(c.id, p);
    await this.rpc(c.id, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'nexior', version: '1' } });
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
}
