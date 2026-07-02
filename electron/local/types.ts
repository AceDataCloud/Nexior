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
  // Optional image result (e.g. computer.screenshot): a `data:image/...` URL the
  // worker surfaces to the vision model so it can SEE the screen.
  image?: string;
}

export interface McpServerConf {
  id: string;
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  // Opt-out toggle (default true = enabled). Disabled servers are not spawned
  // and their tools are hidden from the AI.
  enabled?: boolean;
}

// Live connection status of one configured MCP server, surfaced in Settings so
// the user can tell whether a server actually connected (and why not).
export interface McpServerStatus {
  id: string;
  status: 'connected' | 'failed' | 'disabled';
  toolCount: number;
  tools: string[];
  error?: string;
}

export interface LocalConfig {
  roots: string[];
  mcp: McpServerConf[];
  // Persistent "always allow" consent grants. Each entry is a
  // session-independent key `<tool.name>:<stable json input>` the user
  // explicitly chose to always allow; matching invocations skip the prompt.
  grants?: string[];
  // Opt-in Computer Use (screen capture + mouse/keyboard control). Default
  // false; while false the `computer.*` tools are not advertised or invokable.
  computerUse?: boolean;
}
