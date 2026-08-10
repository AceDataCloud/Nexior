/**
 * Typed accessor for the `window.desktop` bridge exposed by the Electron
 * preload (contextIsolation ON). On web/native this is `undefined`, so every
 * caller must null-check via {@link desktopBridge}.
 *
 * The bridge surface is intentionally minimal and audited — see
 * `electron/preload.ts`. `state` for the OAuth flow never crosses this bridge;
 * it lives entirely in the Electron main process.
 */
export interface DesktopBridge {
  isDesktop: true;
  platform: 'win32' | 'darwin' | string;
  /** Ask main to append a fresh `state`, store it, and open the system browser. */
  openOAuth(authUrl: string): Promise<void>;
  /** Subscribe to the state-validated callback. Payload is `{ code }` only. */
  onAuthCallback(cb: (payload: { code: string }) => void): () => void;
  /** Subscribe to a dropped-callback signal (state mismatch/expired). */
  onAuthExpired(cb: () => void): () => void;
  /** Open an external https link (payment Page, docs) in the system browser. */
  openExternal(url: string): Promise<void>;
  /**
   * Open a connector's OAuth consent page in the system browser.
   *
   * Optional: an older desktop shell has no such handler, and falling back to
   * `window.open` there is a silent no-op (provider hosts aren't on the
   * external-open allowlist), so callers must check before offering the flow.
   */
  openAuthorizeConnector?(url: string): Promise<void>;
  /** Subscribe to native window fullscreen changes (macOS). Fires immediately
   * with the current state, then on every enter/leave. Returns an unsubscribe. */
  onFullscreenChange(cb: (isFullscreen: boolean) => void): () => void;
  /** Handshake: call AFTER auth listeners are attached so main flushes queued deep links. */
  signalReady(): void;
  /** Inform main of the signed-in site origin for the external-open allowlist. */
  setSiteOrigin(origin: string): void;
  /** Show an OS notification via the main process (reliable when window hidden). */
  notify(title: string, body: string): Promise<void>;
  /** Optional because older desktop shells predate the profile updater. */
  updater?: UpdaterBridge;
  /**
   * Scheduled-task daemon controls.
   *
   * The daemon fires locally-executed scheduled tasks from the main process,
   * which is why it needs its own copy of the token: it must keep running after
   * the window closes. The token only ever travels INWARD — nothing here hands
   * it back to the renderer.
   *
   * Optional because the renderer must keep working against a desktop build
   * that predates the daemon — an older shell simply has no `scheduler`, which
   * is what `canRunLocally` checks before offering local execution.
   */
  scheduler?: SchedulerBridge;
}

export type UpdaterPhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'up-to-date'
  | 'error'
  | 'unsupported';

export interface UpdaterState {
  phase: UpdaterPhase;
  currentVersion: string;
  availableVersion?: string;
  percent?: number;
  errorCode?: 'feed_unavailable' | 'network_error' | 'update_failed';
}

export interface UpdaterBridge {
  getState(): Promise<UpdaterState>;
  check(): Promise<UpdaterState>;
  install(): Promise<boolean>;
  onState(cb: (state: UpdaterState) => void): () => void;
}

export interface SchedulerBridge {
  /** This installation's device id + display name + autostart state. */
  identity(): Promise<{ device_id: string; device_name: string; open_at_login: boolean }>;
  /** Hand main the Bearer token to persist (OS-encrypted, 0600). */
  setCredentials(token: string, siteOrigin?: string): Promise<boolean>;
  /** Sign-out. Keeps the device id so tasks bound to this machine survive. */
  clearCredentials(): Promise<boolean>;
  setDeviceName(name: string): Promise<boolean>;
  setOpenAtLogin(enabled: boolean): Promise<boolean>;
  status(): Promise<{
    state: 'stopped' | 'running' | 'signed_out';
    error?: string;
    taskCount: number;
    schedule: { id: string; name: string; nextAt: number | null }[];
  }>;
  /** Run a device-bound task now, through the daemon. The cloud's own trigger
   *  runs the loop server-side with no client attached, so it cannot execute
   *  local tools. Optional: older desktop shells don't have it. */
  runNow?(taskId: string): Promise<{ ok: boolean; reason?: string }>;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
    localExec?: LocalExecBridge;
  }
}

export function desktopBridge(): DesktopBridge | undefined {
  return typeof window !== 'undefined' ? window.desktop : undefined;
}

/**
 * Local tool execution bridge (desktop only). Lets aichat2 client-side tools
 * run on the user's machine: list authorized local tools and invoke one. Each
 * invoke is gated in the main process (sender-origin check + per-tool consent).
 * `undefined` on web/native — callers must null-check.
 */
export interface LocalToolSpec {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  source: 'builtin' | 'mcp';
  mutates: boolean;
}
/** Live connection status of one configured local MCP server. */
export interface IMcpServerStatus {
  id: string;
  status: 'connected' | 'failed' | 'disabled' | string;
  toolCount: number;
  tools: string[];
  error?: string;
}
export interface LocalExecBridge {
  available: true;
  listTools(): Promise<LocalToolSpec[]>;
  invoke(inv: {
    name: string;
    input: object;
    sessionId: string;
  }): Promise<{ output: string; is_error?: boolean; image?: string }>;
  getConfig(): Promise<{
    roots: string[];
    mcp: {
      id: string;
      command: string;
      args: string[];
      cwd?: string;
      env?: Record<string, string>;
      enabled?: boolean;
    }[];
    computerUse?: boolean;
    /** The user's chosen project directory (desktop only). */
    workingDir?: string;
  }>;
  saveConfig(cfg: {
    roots: string[];
    mcp: {
      id: string;
      command: string;
      args: string[];
      cwd?: string;
      env?: Record<string, string>;
      enabled?: boolean;
    }[];
    computerUse?: boolean;
    /** Omit to leave the stored working directory untouched. */
    workingDir?: string;
  }): Promise<boolean>;
  /** Per-server MCP connection status + targeted reconnect (desktop only). */
  mcp?: {
    status(): Promise<IMcpServerStatus[]>;
    reconnect(id: string): Promise<IMcpServerStatus | null>;
  };
  pickFolder(): Promise<string | null>;
  /** macOS TCC permission status + jump-to-System-Settings (undefined off macOS desktop). */
  perm?: {
    status(): Promise<{ mac: boolean; fullDisk: boolean; screen: string; mic: string; accessibility: boolean }>;
    openPane(k: 'fullDisk' | 'screen' | 'accessibility'): Promise<boolean>;
    askMedia(t: 'camera' | 'microphone'): Promise<boolean>;
  };
  /** Persistent "always allow" consent grants (undefined off desktop). Each key
   * is `<tool.name>:<json input>`; revoking re-arms the per-call prompt. */
  grants?: {
    list(): Promise<string[]>;
    revoke(key: string): Promise<boolean>;
    clear(): Promise<boolean>;
    /** Tool-wide always-allow for a builtin tool (native confirm in main). */
    grantToolWide?(name: string): Promise<{ grants: string[]; ok: boolean }>;
  };
  /** Builtin (fs/shell) tool specs for the per-tool always-allow toggles.
   * Undefined on older preloads. */
  builtinTools?(): Promise<{ name: string; description: string; mutates: boolean }[]>;
  /** Connected MCP tool specs for the per-tool always-allow toggles.
   * Undefined on older preloads. */
  mcpTools?(): Promise<{ name: string; description: string; writes: boolean }[]>;
  /** Subscribe to the global panic hotkey forcing Computer Use off. Returns an
   * unsubscribe fn. Undefined on older preloads. */
  onComputerUseDisabled?(cb: () => void): () => void;
  /** Names + descriptions of the computer.* tools, for the per-action toggle
   * list. Undefined on older preloads. */
  computerTools?(): Promise<{ name: string; description: string }[]>;
  /** Pre-approve computer.* actions (persistent always-allow), enable Computer
   * Use, and trigger the macOS Screen Recording / Accessibility prompts. Pass a
   * subset of tool names to allow only those; omit for every action. Returns the
   * new grant list + permission status. */
  preauthorizeComputerUse?(names?: string[]): Promise<{
    grants: string[];
    perm: { mac: boolean; fullDisk: boolean; screen: string; mic: string; accessibility: boolean };
    computerUse: boolean;
  }>;
}

export function localExec(): LocalExecBridge | undefined {
  return typeof window !== 'undefined' ? window.localExec : undefined;
}
