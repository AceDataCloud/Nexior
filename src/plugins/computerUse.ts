import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

/**
 * Android Computer Use — the mobile analogue of the desktop `window.localExec`
 * computer.* tools. Backed by a native AccessibilityService + takeScreenshot
 * (see android/app/src/main/java/com/acedatacloud/nexior/ComputerUsePlugin.java
 * and the plan plans/nexior-desktop/COMPUTER-USE-ANDROID.md).
 *
 * Android-only. On iOS/web these reject — callers must guard on the surface.
 * Every method also rejects until the user enables the accessibility service.
 */
export interface ComputerUseStatus {
  /** Accessibility service enabled AND running. */
  accessibility: boolean;
  /** True when we can capture the screen (Android 11+ and service running). */
  canScreenshot: boolean;
}

export interface ComputerUseScreenshotResult {
  /** `data:image/jpeg;base64,…` — same shape the desktop returns, so the
   *  screenshot→URL upload (#1107) path is reused verbatim. */
  image: string;
  /** Raw pixel dimensions; tap coordinates share this exact space (1:1). */
  width: number;
  height: number;
}

export interface ComputerUseActionResult {
  ok: boolean;
  note?: string;
}

/** JSON-array string of on-screen actionable elements (see native `dumpUi`). */
export interface ComputerUseTreeResult {
  tree: string;
}

/** Set-of-Mark observe result: an annotated screenshot + numbered legend. */
export interface ComputerUseObserveResult {
  /** `data:image/jpeg;base64,…` with numbered boxes drawn on each element. */
  image: string;
  /** JSON-array string: `[{n, label, x, y}]`. */
  marks: string;
  width: number;
  height: number;
}

export interface ComputerUsePlugin {
  status(): Promise<ComputerUseStatus>;
  /** Deep-link to Settings → Accessibility so the user can enable the service. */
  openAccessibilitySettings(): Promise<void>;
  /** Native 3-tier on-demand consent (Allow once / Always allow / Deny),
   *  mirroring the desktop native confirm. Back / tap-outside = deny. */
  confirmConsent(options: {
    title: string;
    message: string;
    onceLabel: string;
    alwaysLabel: string;
    denyLabel: string;
  }): Promise<{ choice: 'once' | 'always' | 'deny' }>;
  screenshot(): Promise<ComputerUseScreenshotResult>;
  click(options: { x: number; y: number; button?: string }): Promise<ComputerUseActionResult>;
  move(options: { x: number; y: number }): Promise<ComputerUseActionResult>;
  scroll(options: { x?: number; y?: number; scrollX?: number; scrollY?: number }): Promise<ComputerUseActionResult>;
  type(options: { text: string }): Promise<ComputerUseActionResult>;
  key(options: { keys: string[] }): Promise<ComputerUseActionResult>;
  /** Snapshot the current window's accessibility tree (precise tap targets). */
  dumpUi(): Promise<ComputerUseTreeResult>;
  /** Tap an element by its visible text / content-description (semantic tap). */
  tapText(options: { text: string }): Promise<ComputerUseActionResult>;
  /** Set-of-Mark: annotated screenshot + numbered legend of actionable elements. */
  observe(): Promise<ComputerUseObserveResult>;
  /** Tap the numbered mark from the last observe(). */
  tapMark(options: { mark: number }): Promise<ComputerUseActionResult>;
  /** Start/stop the foreground session that keeps the agent loop alive. */
  startSession(): Promise<void>;
  stopSession(): Promise<void>;
  /** Re-arm Computer Use after a user Stop (clears the native kill flag). */
  resetStop(): Promise<void>;
  /** Fires when the user taps Stop on the session notification (kill switch). */
  addListener(
    eventName: 'computerUseDisabled',
    listenerFunc: () => void
  ): Promise<PluginListenerHandle> & PluginListenerHandle;
}

export const ComputerUse = registerPlugin<ComputerUsePlugin>('ComputerUse');
