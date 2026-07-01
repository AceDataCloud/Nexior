import { McpHost } from './mcp';
import * as fsTool from './fs';
import { run_command } from './shell';
import * as computer from './computer';
import type { McpServerConf, ToolInvoke, ToolResult, ToolSpec } from './types';

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

class Registry {
  private host = new McpHost();
  private mcpSpecs: ToolSpec[] = [];
  private names = new Set([...BUILTIN, ...COMPUTER_TOOLS].map((s) => s.name));
  // Opt-in Computer Use (screen capture + mouse/keyboard). Default OFF; toggled
  // from Settings → Local Tools. While off, the tools are neither advertised nor
  // invokable.
  private computerUse = false;

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

  async boot(servers: McpServerConf[]): Promise<void> {
    for (const s of servers) {
      try {
        await this.host.start(s);
        const tools = await this.host.listTools(s.id);
        this.mcpSpecs.push(...tools);
        tools.forEach((t) => this.names.add(t.name));
      } catch {
        /* server failed to start — skip; UI surfaces config errors separately */
      }
    }
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
      const [, server, tool] = inv.name.split('.');
      return this.host.call(server, tool, inv.input);
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
