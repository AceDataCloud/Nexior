// Local tool execution types — shared by main-process modules and preload.
// Desktop-only: lets aichat2 client-side tools run on the user's machine
// (read/write files, run commands, local MCP), Claude-Desktop style.

export interface ToolSpec {
  name: string; // 'fs.read_file' | 'shell.run_command' | 'mcp.<server>.<tool>'
  description: string;
  input_schema: Record<string, unknown>;
  source: 'builtin' | 'mcp';
  mutates: boolean; // write/exec ⇒ always re-confirm
}

export interface ToolInvoke {
  name: string;
  input: Record<string, unknown>;
  sessionId: string;
}

export interface ToolResult {
  output: string;
  is_error?: boolean;
}

export interface McpServerConf {
  id: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface LocalConfig {
  roots: string[];
  mcp: McpServerConf[];
}
