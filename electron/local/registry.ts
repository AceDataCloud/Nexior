import { McpHost } from './mcp';
import * as fsTool from './fs';
import { run_command } from './shell';
import * as computer from './computer';
import type { McpServerConf, McpServerStatus, ToolInvoke, ToolResult, ToolSpec } from './types';

const BUILTIN: ToolSpec[] = [
  { name: 'fs.read_file', description: 'Read a UTF-8 file inside an authorized root', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }, source: 'builtin', mutates: false },
  { name: 'fs.list_dir', description: 'List a directory inside an authorized root', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }, source: 'builtin', mutates: false },
  { name: 'fs.write_file', description: 'Write a file inside an authorized root', input_schema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] }, source: 'builtin', mutates: true },
  { name: 'shell.run_command', description: 'Run a local command (argv form)', input_schema: { type: 'object', properties: { cmd: { type: 'string' }, args: { type: 'array', items: { type: 'string' } }, cwd: { type: 'string' } }, required: ['cmd'] }, source: 'builtin', mutates: true }
];

// Computer-use POC: see + control the GUI on the user's own machine. Kept in a
// SEPARATE, opt-in group: these specs are only advertised (and only invokable)
// when the user enables Computer Use in Settings. Disabled by default, so on web
// these never exist (no localExec bridge) and on desktop they aren't sent as
// `client_tools` until opted in — no wasted prompt tokens on any surface. macOS
// needs Screen Recording (capture) + Accessibility (input); all gated by
// per-call consent (mutates: true).
const COMPUTER_TOOLS: ToolSpec[] = [
  { name: 'computer.screenshot', description: "Capture the user's screen (primary display) on their local machine. Returns saved PNG path + dimensions in logical pixels. Use to see the current UI before acting.", input_schema: { type: 'object', properties: {} }, source: 'builtin', mutates: true },
  { name: 'computer.click', description: "Click the mouse at logical-pixel (x, y) on the user's local screen.", input_schema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, button: { type: 'string', enum: ['left', 'right', 'middle'] } }, required: ['x', 'y'] }, source: 'builtin', mutates: true },
  { name: 'computer.move', description: "Move the mouse pointer to logical-pixel (x, y) on the user's local screen.", input_schema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' } }, required: ['x', 'y'] }, source: 'builtin', mutates: true },
  { name: 'computer.type', description: "Type text via the keyboard on the user's local machine.", input_schema: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] }, source: 'builtin', mutates: true },
  { name: 'computer.key', description: "Press a key combo on the user's local machine, e.g. ['cmd','t'] or ['enter'].", input_schema: { type: 'object', properties: { keys: { type: 'array', items: { type: 'string' } } }, required: ['keys'] }, source: 'builtin', mutates: true },
  { name: 'computer.scroll', description: "Scroll the user's local screen (optionally move to x,y first). Positive scrollY = down, positive scrollX = right.", input_schema: { type: 'object', properties: { x: { type: 'number' }, y: { type: 'number' }, scrollX: { type: 'number' }, scrollY: { type: 'number' } }, required: [] }, source: 'builtin', mutates: true }
];

function isComputerTool(name: string): boolean {
  return name.startsWith('computer.');
}

// A first connect can fail on a slow machine (the MCP server exceeds its
// `initialize` budget). Rather than strand it as `failed` until the user
// manually clicks Test/Reconnect, retry a few times in the background.
const MCP_BOOT_RETRIES = 3;
const MCP_BOOT_RETRY_DELAY_MS = 5_000;

export class Registry {
  private mcpSpecs: ToolSpec[] = [];
  private names = new Set([...BUILTIN, ...COMPUTER_TOOLS].map((s) => s.name));
  // Per-server connection status (id -> status), surfaced in Settings.
  private mcpStatuses = new Map<string, McpServerStatus>();
  // Opt-in Computer Use (screen capture + mouse/keyboard). Default OFF; toggled
  // from Settings → Local Tools. While off, the tools are neither advertised nor
  // invokable.
  private computerUse = false;
  // Bumped on every reboot() so a background retry scheduled against an OLD
  // config is dropped instead of resurrecting a server the user just changed.
  private generation = 0;
  // In-flight connect per id. A second caller (background retry racing a user
  // reconnect) shares the SAME promise instead of spawning a second child, and
  // gets the real result — not a stale `false`. Cleared via `.finally`.
  private connecting = new Map<string, Promise<boolean>>();

  // `host` + retry knobs are injectable for tests; production uses the defaults.
  constructor(
    private host: McpHost = new McpHost(),
    private retries = MCP_BOOT_RETRIES,
    private retryDelayMs = MCP_BOOT_RETRY_DELAY_MS
  ) {}

  setComputerUse(on: boolean): void {
    this.computerUse = on === true;
  }

  // Names of the computer-use tools, regardless of whether the feature is
  // currently enabled — used by the "pre-approve all computer actions" flow to
  // persist a grant per tool up front.
  computerToolNames(): string[] {
    return COMPUTER_TOOLS.map((s) => s.name);
  }

  // Full specs (name + description) of the computer-use tools, for the Settings
  // per-action always-allow toggle list. Independent of whether the feature is on.
  computerToolSpecs(): { name: string; description: string }[] {
    return COMPUTER_TOOLS.map((s) => ({ name: s.name, description: s.description }));
  }

  // Builtin (fs/shell) tool specs for the Settings per-tool always-allow toggles.
  // `mutates` lets the UI flag the dangerous ones (shell/write) distinctly.
  builtinToolSpecs(): { name: string; description: string; mutates: boolean }[] {
    return BUILTIN.map((s) => ({ name: s.name, description: s.description, mutates: s.mutates }));
  }

  // Whether a name is a registered builtin tool — used to validate a tool-wide
  // grant request so it can never persist an unknown/MCP/computer name.
  isBuiltinTool(name: string): boolean {
    return BUILTIN.some((s) => s.name === name);
  }

  async boot(servers: McpServerConf[]): Promise<void> {
    const gen = this.generation;
    for (const s of servers) {
      if (s.enabled === false) {
        this.mcpStatuses.set(s.id, { id: s.id, status: 'disabled', toolCount: 0, tools: [] });
        continue;
      }
      const ok = await this.connectServer(s);
      // A failed first connect (e.g. a slow cold start that blew the startup
      // timeout) retries in the background so it recovers without the user.
      if (!ok) this.scheduleRetry(s, gen, 1);
    }
  }

  // Connect (or reconnect) ONE server. Concurrent calls for the same id share
  // one in-flight attempt (dedup) so a background retry racing a user reconnect
  // can't double-spawn or orphan a child; the loser awaits the same real result.
  private connectServer(s: McpServerConf): Promise<boolean> {
    const inflight = this.connecting.get(s.id);
    if (inflight) return inflight;
    const p = this.doConnect(s).finally(() => this.connecting.delete(s.id));
    this.connecting.set(s.id, p);
    return p;
  }

  // Drop any stale specs for this id, spawn + handshake, then record its
  // tools/status. Idempotent: safe to re-run for a retry or a reconnect.
  private async doConnect(s: McpServerConf): Promise<boolean> {
    const prefix = `mcp.${s.id}.`;
    this.mcpSpecs = this.mcpSpecs.filter((x) => !x.name.startsWith(prefix));
    this.rebuildNames();
    this.host.stop(s.id);
    try {
      await this.host.start(s);
      const tools = await this.host.listTools(s.id);
      this.mcpSpecs.push(...tools);
      this.rebuildNames();
      this.mcpStatuses.set(s.id, { id: s.id, status: 'connected', toolCount: tools.length, tools: tools.map((t) => t.name) });
      return true;
    } catch (e) {
      // Record the reason so Settings can show it instead of failing silently.
      this.host.stop(s.id);
      this.mcpStatuses.set(s.id, { id: s.id, status: 'failed', toolCount: 0, tools: [], error: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  // Background retry for a failed first-connect. Stops once connected, out of
  // attempts, or once a reboot (new generation) supersedes this config.
  private scheduleRetry(s: McpServerConf, gen: number, attempt: number): void {
    if (attempt > this.retries) return;
    setTimeout(() => {
      void (async () => {
        if (gen !== this.generation) return; // rebooted since — config changed
        if (this.mcpStatuses.get(s.id)?.status === 'connected') return;
        const ok = await this.connectServer(s);
        if (!ok && gen === this.generation) this.scheduleRetry(s, gen, attempt + 1);
      })();
    }, this.retryDelayMs * attempt);
  }

  private rebuildNames(): void {
    this.names = new Set([...BUILTIN, ...COMPUTER_TOOLS].map((s) => s.name).concat(this.mcpSpecs.map((s) => s.name)));
  }

  // Hot-reapply the MCP server set: stop the running servers, drop their tool
  // specs + names (keeping builtin + computer), then re-boot from the new
  // config. Called by `local.config.save` so editing MCP servers in Settings
  // takes effect immediately, without restarting the app.
  async reboot(servers: McpServerConf[]): Promise<void> {
    this.generation++; // invalidate any pending background boot retries
    this.host.stopAll();
    this.mcpSpecs = [];
    this.rebuildNames();
    this.mcpStatuses.clear();
    await this.boot(servers);
  }

  // Current connection status of every configured MCP server.
  mcpStatus(): McpServerStatus[] {
    return [...this.mcpStatuses.values()];
  }

  // Re-spawn just ONE server ("Test / Reconnect" in Settings): kill its proc,
  // drop its specs/names, then boot only it from the persisted list. Returns
  // its fresh status. Other servers are left untouched.
  async reconnect(id: string, servers: McpServerConf[]): Promise<McpServerStatus | undefined> {
    const conf = servers.find((s) => s.id === id);
    // Server removed from the saved config: stop it and drop its specs/status.
    if (!conf) {
      this.host.stop(id);
      const prefix = `mcp.${id}.`;
      this.mcpSpecs = this.mcpSpecs.filter((s) => !s.name.startsWith(prefix));
      this.rebuildNames();
      this.mcpStatuses.delete(id);
      return undefined;
    }
    if (conf.enabled === false) {
      this.host.stop(id);
      const prefix = `mcp.${id}.`;
      this.mcpSpecs = this.mcpSpecs.filter((s) => !s.name.startsWith(prefix));
      this.rebuildNames();
      this.mcpStatuses.set(id, { id, status: 'disabled', toolCount: 0, tools: [] });
      return this.mcpStatuses.get(id);
    }
    // User-initiated: connect once, no background retry (they're watching and
    // can click Test/Reconnect again).
    await this.connectServer(conf);
    return this.mcpStatuses.get(id);
  }

  specs(): ToolSpec[] {
    return [...BUILTIN, ...(this.computerUse ? COMPUTER_TOOLS : []), ...this.mcpSpecs];
  }

  isKnown(name: string): boolean {
    if (isComputerTool(name)) return this.computerUse && this.names.has(name);
    return this.names.has(name);
  }

  async invoke(inv: ToolInvoke): Promise<ToolResult> {
    if (!this.isKnown(inv.name)) return { output: `unknown tool ${inv.name}`, is_error: true };
    // Defense in depth: even if a stale renderer calls a computer.* tool while
    // the feature is disabled, refuse it here too.
    if (isComputerTool(inv.name) && !this.computerUse) return { output: 'computer use is disabled', is_error: true };
    if (inv.name.startsWith('mcp.')) {
      // Split at the FIRST dot after the `mcp.` prefix: the server id is
      // constrained to [A-Za-z0-9_-] (no dots) by the config UI, so everything
      // after it is the tool name — which MAY itself contain dots.
      const rest = inv.name.slice('mcp.'.length);
      const dot = rest.indexOf('.');
      if (dot < 0) return { output: `bad mcp tool name ${inv.name}`, is_error: true };
      return this.host.call(rest.slice(0, dot), rest.slice(dot + 1), inv.input);
    }
    if (inv.name === 'fs.read_file') return fsTool.read_file(inv.input as { path: string });
    if (inv.name === 'fs.list_dir') return fsTool.list_dir(inv.input as { path: string });
    if (inv.name === 'fs.write_file') return fsTool.write_file(inv.input as { path: string; content: string });
    if (inv.name === 'shell.run_command') return run_command(inv.input as { cmd: string; args?: string[]; cwd?: string });
    if (inv.name === 'computer.screenshot') return computer.screenshot();
    if (inv.name === 'computer.click') return computer.click(inv.input as { x: number; y: number; button?: 'left' | 'right' | 'middle' });
    if (inv.name === 'computer.move') return computer.move(inv.input as { x: number; y: number });
    if (inv.name === 'computer.type') return computer.type_text(inv.input as { text: string });
    if (inv.name === 'computer.key') return computer.key_press(inv.input as { keys: string[] });
    if (inv.name === 'computer.scroll') return computer.scroll(inv.input as { x?: number; y?: number; scrollX?: number; scrollY?: number });
    return { output: `unhandled tool ${inv.name}`, is_error: true };
  }

  stop(): void {
    this.host.stopAll();
  }
}

export const registry = new Registry();
