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
  invoke: (inv: { name: string; input: object; sessionId: string }): Promise<{ output: string; is_error?: boolean }> =>
    ipcRenderer.invoke('local.tool.invoke', inv)
});
