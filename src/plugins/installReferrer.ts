import { registerPlugin } from '@capacitor/core';

export interface InstallReferrerResult {
  // Raw install referrer string from the Play Store, e.g.
  // "inviter_id=abc&click_id=def" (urlencoded as set on the store link).
  referrer: string;
}

export interface InstallReferrerPlugin {
  getReferrer(): Promise<InstallReferrerResult>;
}

/**
 * Bridges the custom Android `InstallReferrer` plugin (see
 * android/app/src/main/java/com/acedatacloud/nexior/InstallReferrerPlugin.java).
 * Android-only — on iOS/web `getReferrer()` rejects, callers must guard.
 */
export const InstallReferrer = registerPlugin<InstallReferrerPlugin>('InstallReferrer');
