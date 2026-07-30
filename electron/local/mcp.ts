import { spawn, ChildProcess } from 'node:child_process';
import { resolveEnhancedPath, windowsNodeDirs } from './env';
import type { McpServerConf, ToolSpec, ToolResult } from './types';

// Re-exported so existing importers/tests keep resolving it from here; the
// implementation now lives in env.ts, shared with shell.run_command.
export { windowsNodeDirs };

const RPC_TIMEOUT_MS = 30_000;
// The initial `initialize` handshake gets a longer budget than a mid-turn call:
// a cold MCP server (e.g. `node …/@playwright/mcp` loading playwright-core) on a
// slow machine can take far longer than RPC_TIMEOUT_MS just to boot Node + its
// deps before it answers — a first-boot timeout would strand it as `failed`.
const STARTUP_TIMEOUT_MS = 60_000;
// Mirrors the cap in computer.ts: stay under the aichat2 worker's tool-result
// image budget (~6 MB of base64). An MCP image over budget is dropped from the
// `image` channel and left as text in `output` rather than blowing up the turn.
const MAX_IMAGE_B64_CHARS = 5_400_000;
// The aichat2 worker only accepts these in a tool result's `image`
// (isValidResultImage in handlers/conversations.ts). Lifting anything else
// would be WORSE than doing nothing: the worker drops it silently AND we would
// have already removed it from `output` — the image vanishes with no trace.
// Keep this in sync with the worker's regex.
const LIFTABLE_IMAGE_MIME = /^image\/(png|jpe?g|webp)$/;

interface Pending { resolve: (v: unknown) => void; reject: (e: Error) => void; timer: NodeJS.Timeout; }

// One block of an MCP `tools/call` result. Only `image` needs special handling;
// everything else is serialized into `output` as before. MCP also defines
// `audio`, `resource` and `resource_link` blocks — those have no channel to the
// model today (ToolResult carries an image only), so they stay in `output`.
interface McpContentBlock {
  type?: string;
  data?: string;
  mimeType?: string;
  [k: string]: unknown;
}

// Why a block could not be lifted, so `output` can say so instead of the image
// disappearing without explanation (which is what made the model claim it had
// displayed a QR code that was never there).
function liftBlocker(b: McpContentBlock): string | null {
  const mime = b.mimeType || 'image/png';
  if (!LIFTABLE_IMAGE_MIME.test(mime)) return `unsupported type ${mime} (expected png/jpeg/webp)`;
  if ((b.data?.length ?? 0) > MAX_IMAGE_B64_CHARS) return 'too large to send';
  return null;
}

// Map an MCP `tools/call` result to a ToolResult. Exported for tests.
// Lifts the first liftable image block into `image` (the same channel
// computer.screenshot uses) so the model actually SEES it. Left inside
// `output` it was only a base64 blob in a JSON string: unrenderable, and the
// model would claim to have shown a picture it never received.
export function mapCallResult(r: { content?: unknown; isError?: boolean }): ToolResult {
  const blocks = Array.isArray(r.content) ? (r.content as McpContentBlock[]) : [];
  const images = blocks.filter((b) => b?.type === 'image' && typeof b.data === 'string');
  const img = images.find((b) => liftBlocker(b) === null);
  const image = img ? `data:${img.mimeType || 'image/png'};base64,${img.data}` : undefined;
  // Replace every image block with a short note: the lifted one is already in
  // `image` (no need to repeat 5 MB of base64 in the text channel), and a
  // non-liftable one must not silently vanish — the model should know an image
  // exists that it cannot see, rather than assume it was shown.
  const rest = blocks.map((b) => {
    if (!images.includes(b)) return b;
    if (b === img) return { type: 'text', text: '[image returned separately and shown to you]' };
    return { type: 'text', text: `[image not shown: ${liftBlocker(b)}]` };
  });
  return {
    output: JSON.stringify(Array.isArray(r.content) ? rest : (r.content ?? '')),
    is_error: !!r.isError,
    ...(image ? { image } : {})
  };
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
        this.rpc(c.id, 'initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'nexior', version: '1' } }, STARTUP_TIMEOUT_MS),
        spawnError
      ]);
    } catch (e) {
      // Fold the stderr tail into the error so the Settings row can show a real
      // reason (npm 404, python traceback, "command not found", …).
      const tail = (this.stderrTail.get(c.id) ?? '').trim().split('\n').slice(-3).join(' ');
      throw new Error((e instanceof Error ? e.message : String(e)) + (tail ? ` — ${tail}` : ''));
    }
  }

  private rpc(server: string, method: string, params: unknown, timeoutMs: number = RPC_TIMEOUT_MS): Promise<unknown> {
    const proc = this.procs.get(server);
    if (!proc?.stdin) return Promise.reject(new Error(`mcp ${server} not running`));
    const id = ++this.seq;
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error('mcp rpc timeout')); }, timeoutMs);
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
    return mapCallResult(r);
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
