import { registerPlugin } from '@capacitor/core';

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

export interface ComputerUsePlugin {
  status(): Promise<ComputerUseStatus>;
  /** Deep-link to Settings → Accessibility so the user can enable the service. */
  openAccessibilitySettings(): Promise<void>;
  screenshot(): Promise<ComputerUseScreenshotResult>;
  click(options: { x: number; y: number; button?: string }): Promise<ComputerUseActionResult>;
  move(options: { x: number; y: number }): Promise<ComputerUseActionResult>;
  scroll(options: { x?: number; y?: number; scrollX?: number; scrollY?: number }): Promise<ComputerUseActionResult>;
  type(options: { text: string }): Promise<ComputerUseActionResult>;
  key(options: { keys: string[] }): Promise<ComputerUseActionResult>;
}

export const ComputerUse = registerPlugin<ComputerUsePlugin>('ComputerUse');
