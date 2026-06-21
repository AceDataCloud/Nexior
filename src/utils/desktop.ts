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
  /** Handshake: call AFTER auth listeners are attached so main flushes queued deep links. */
  signalReady(): void;
  /** Inform main of the signed-in site origin for the external-open allowlist. */
  setSiteOrigin(origin: string): void;
}

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

export function desktopBridge(): DesktopBridge | undefined {
  return typeof window !== 'undefined' ? window.desktop : undefined;
}
