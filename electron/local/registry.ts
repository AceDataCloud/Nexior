import { McpHost } from './mcp';
import * as fsTool from './fs';
import { run_command } from './shell';
import type { McpServerConf, ToolInvoke, ToolResult, ToolSpec } from './types';

const BUILTIN: ToolSpec[] = [
  { name: 'fs.read_file', description: 'Read a UTF-8 file inside an authorized root', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }, source: 'builtin', mutates: false },
  { name: 'fs.list_dir', description: 'List a directory inside an authorized root', input_schema: { type: 'object', properties: { path: { type: 'string' } }, required: ['path'] }, source: 'builtin', mutates: false },
  { name: 'fs.write_file', description: 'Write a file inside an authorized root', input_schema: { type: 'object', properties: { path: { type: 'string' }, content: { type: 'string' } }, required: ['path', 'content'] }, source: 'builtin', mutates: true },
  { name: 'shell.run_command', description: 'Run a local command (argv form)', input_schema: { type: 'object', properties: { cmd: { type: 'string' }, args: { type: 'array', items: { type: 'string' } }, cwd: { type: 'string' } }, required: ['cmd'] }, source: 'builtin', mutates: true }
];

class Registry {
  private host = new McpHost();
  private mcpSpecs: ToolSpec[] = [];
  private names = new Set(BUILTIN.map((s) => s.name));

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
    return [...BUILTIN, ...this.mcpSpecs];
  }

  isKnown(name: string): boolean {
    return this.names.has(name);
  }

  async invoke(inv: ToolInvoke): Promise<ToolResult> {
    if (!this.isKnown(inv.name)) return { output: `unknown tool ${inv.name}`, is_error: true };
    if (inv.name.startsWith('mcp.')) {
      const [, server, tool] = inv.name.split('.');
      return this.host.call(server, tool, inv.input);
    }
    if (inv.name === 'fs.read_file') return fsTool.read_file(inv.input as { path: string });
    if (inv.name === 'fs.list_dir') return fsTool.list_dir(inv.input as { path: string });
    if (inv.name === 'fs.write_file') return fsTool.write_file(inv.input as { path: string; content: string });
    if (inv.name === 'shell.run_command') return run_command(inv.input as { cmd: string; args?: string[]; cwd?: string });
    return { output: `unhandled tool ${inv.name}`, is_error: true };
  }

  stop(): void {
    this.host.stopAll();
  }
}

export const registry = new Registry();
