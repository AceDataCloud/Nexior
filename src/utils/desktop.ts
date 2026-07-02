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
  /** Subscribe to native window fullscreen changes (macOS). Fires immediately
   * with the current state, then on every enter/leave. Returns an unsubscribe. */
  onFullscreenChange(cb: (isFullscreen: boolean) => void): () => void;
  /** Handshake: call AFTER auth listeners are attached so main flushes queued deep links. */
  signalReady(): void;
  /** Inform main of the signed-in site origin for the external-open allowlist. */
  setSiteOrigin(origin: string): void;
  /** Show an OS notification via the main process (reliable when window hidden). */
  notify(title: string, body: string): Promise<void>;
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
    mcp: { id: string; command: string; args: string[]; cwd?: string; env?: Record<string, string> }[];
    computerUse?: boolean;
  }>;
  saveConfig(cfg: {
    roots: string[];
    mcp: { id: string; command: string; args: string[]; cwd?: string; env?: Record<string, string> }[];
    computerUse?: boolean;
  }): Promise<boolean>;
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
