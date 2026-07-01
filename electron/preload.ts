import { contextBridge, ipcRenderer } from 'electron';

/**
 * Minimal, audited bridge exposed to the renderer as `window.desktop`.
 * contextIsolation ON, nodeIntegration OFF, sandbox ON. The OAuth `state`
 * nonce never crosses this bridge — it lives entirely in the main process.
 *
 * Mirrors the `DesktopBridge` interface in `src/utils/desktop.ts`.
 */
contextBridge.exposeInMainWorld('desktop', {
  isDesktop: true,
  platform: process.platform, // 'win32' | 'darwin'

  // Renderer hands a provider auth URL WITHOUT state; main appends a fresh
  // state nonce, stores it, and opens the system browser. Result arrives via
  // onAuthCallback.
  openOAuth: (authUrl: string): Promise<void> => ipcRenderer.invoke('auth:openOAuth', authUrl),

  // Fired once main has received AND state-validated the deep-link callback.
  // Payload is { code } only — state never reaches the renderer.
  onAuthCallback: (cb: (payload: { code: string }) => void): (() => void) => {
    const handler = (_e: unknown, payload: { code: string }) => cb(payload);
    ipcRenderer.on('auth:callback', handler);
    return () => ipcRenderer.removeListener('auth:callback', handler);
  },

  // Fired when a callback was dropped (state mismatch/expired) so the UI can
  // show "login link expired" instead of hanging silently.
  onAuthExpired: (cb: () => void): (() => void) => {
    const handler = () => cb();
    ipcRenderer.on('auth:expired', handler);
    return () => ipcRenderer.removeListener('auth:expired', handler);
  },

  // Open an external https link (payment Page, docs) in the system browser.
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke('shell:openExternal', url),

  // Subscribe to native window fullscreen changes (macOS green button /
  // setFullScreen). Emits the current state immediately, then on every change.
  // In fullscreen the traffic lights are hidden, so the UI drops its inset.
  onFullscreenChange: (cb: (isFullscreen: boolean) => void): (() => void) => {
    const handler = (_e: unknown, isFullscreen: boolean) => cb(isFullscreen);
    ipcRenderer.on('window:fullscreen', handler);
    void ipcRenderer.invoke('window:isFullscreen').then((v: boolean) => cb(!!v));
    return () => ipcRenderer.removeListener('window:fullscreen', handler);
  },

  // Handshake: called from App.vue mounted() AFTER onAuthCallback is subscribed
  // so main only flushes a queued deep link once a listener exists.
  signalReady: (): void => ipcRenderer.send('renderer:ready'),

  // Tell main the signed-in site origin so white-label custom domains are
  // allowed by the external-open / navigation guard (not just acedata.cloud).
  setSiteOrigin: (origin: string): void => ipcRenderer.send('site:setOrigin', origin),

  // Show an OS notification via the main process (reliable when the window is
  // hidden/minimized, unlike Web Notification). Resolves after dispatch.
  notify: (title: string, body: string): Promise<void> => ipcRenderer.invoke('notify:show', { title, body })
});

// Local tool execution (desktop only): list authorized local tools and invoke
// one. Each invoke is gated by main (sender-origin check + per-tool consent).
contextBridge.exposeInMainWorld('localExec', {
  available: true,
  listTools: (): Promise<unknown[]> => ipcRenderer.invoke('local.tools.list'),
  invoke: (inv: { name: string; input: object; sessionId: string }): Promise<{ output: string; is_error?: boolean; image?: string }> =>
    ipcRenderer.invoke('local.tool.invoke', inv),
  getConfig: (): Promise<{ roots: string[]; mcp: object[]; computerUse?: boolean }> => ipcRenderer.invoke('local.config.get'),
  saveConfig: (cfg: { roots: string[]; mcp: object[]; computerUse?: boolean }): Promise<boolean> =>
    ipcRenderer.invoke('local.config.save', cfg),
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('local.pickFolder'),
  // macOS system-permission status + jump-to-pane, shown in the LocalTools panel.
  perm: {
    status: (): Promise<{ mac: boolean; fullDisk: boolean; screen: string; mic: string; accessibility: boolean }> =>
      ipcRenderer.invoke('local.perm.status'),
    openPane: (k: 'fullDisk' | 'screen' | 'accessibility'): Promise<boolean> =>
      ipcRenderer.invoke('local.perm.openPane', k),
    askMedia: (t: 'camera' | 'microphone'): Promise<boolean> => ipcRenderer.invoke('local.perm.askMedia', t)
  },
  // Persistent "always allow" consent grants, managed from the LocalTools panel.
  grants: {
    list: (): Promise<string[]> => ipcRenderer.invoke('local.grants.list'),
    revoke: (key: string): Promise<boolean> => ipcRenderer.invoke('local.grants.revoke', key),
    clear: (): Promise<boolean> => ipcRenderer.invoke('local.grants.clear'),
    // Tool-wide always-allow for a builtin tool (native confirm in main).
    grantToolWide: (name: string): Promise<{ grants: string[]; ok: boolean }> =>
      ipcRenderer.invoke('local.grants.grantToolWide', name)
  },
  // Builtin (fs/shell) tool specs for the per-tool always-allow toggles.
  builtinTools: (): Promise<{ name: string; description: string; mutates: boolean }[]> =>
    ipcRenderer.invoke('local.tools.builtin'),
  // Fired when the global panic hotkey forces Computer Use off, so the Settings
  // toggle reflects reality and a later Save can't silently re-enable it.
  onComputerUseDisabled: (cb: () => void): (() => void) => {
    const handler = (): void => cb();
    ipcRenderer.on('local.computerUse.disabled', handler);
    return () => ipcRenderer.removeListener('local.computerUse.disabled', handler);
  },
  // Names + descriptions of the computer.* tools, for the per-action always-allow
  // toggle list in Settings → Local Tools.
  computerTools: (): Promise<{ name: string; description: string }[]> => ipcRenderer.invoke('local.computerUse.tools'),
  // Pre-approve computer.* actions (persistent always-allow) + enable Computer
  // Use + trigger the macOS Screen Recording / Accessibility prompts. Pass a
  // subset of tool names to allow only those; omit for every action.
  preauthorizeComputerUse: (names?: string[]): Promise<{ grants: string[]; perm: unknown; computerUse: boolean }> =>
    ipcRenderer.invoke('local.computerUse.preauthorize', names)
});
