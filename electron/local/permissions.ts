import { systemPreferences, shell } from 'electron';
import fs from 'node:fs';

// macOS TCC permission status + System Settings deep-links. Desktop is non-MAS
// Dev ID, so FDA is read via TCC.db reachability (best-effort heuristic; MAS
// would hard-deny). Tiers above L0 (folder picker) are opt-in and shown in the
// shared LocalTools settings panel.
const MAC = process.platform === 'darwin';
const PANE = 'x-apple.systempreferences:com.apple.preference.security?Privacy_';

export type PaneKey = 'fullDisk' | 'screen' | 'accessibility';

export interface PermStatus {
  mac: boolean;
  fullDisk: boolean;
  screen: string; // 'granted' | 'denied' | 'not-determined' | 'restricted' | 'unknown'
  mic: string;
  accessibility: boolean;
}

export function status(): PermStatus {
  if (!MAC) return { mac: false, fullDisk: true, screen: 'granted', mic: 'granted', accessibility: true };
  return {
    mac: true,
    fullDisk: reachable('/Library/Application Support/com.apple.TCC/TCC.db'),
    screen: systemPreferences.getMediaAccessStatus('screen'),
    mic: systemPreferences.getMediaAccessStatus('microphone'),
    accessibility: systemPreferences.isTrustedAccessibilityClient(false)
  };
}

function reachable(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

export function openPane(k: PaneKey): void {
  if (!MAC) return;
  const seg = { fullDisk: 'AllFiles', screen: 'ScreenCapture', accessibility: 'Accessibility' }[k];
  void shell.openExternal(PANE + seg);
}

export async function askMedia(t: 'camera' | 'microphone'): Promise<boolean> {
  if (!MAC) return true;
  return systemPreferences.askForMediaAccess(t);
}

// Prompt accessibility once (true triggers the system dialog); ignore on non-mac.
export function promptAccessibility(): boolean {
  return MAC ? systemPreferences.isTrustedAccessibilityClient(true) : true;
}
