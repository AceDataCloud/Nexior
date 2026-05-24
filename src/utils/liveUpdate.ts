import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { App as CapApp } from '@capacitor/app';
import axios from 'axios';
import { compareVersions } from '@/utils/versionGate';
import { isAndroid, isIOS, isNative } from '@/utils/surface';

/**
 * Shape of the manifest we host at
 * `<base>/<channel>/<platform>.json` (e.g. `stable/ios.json`). The
 * release pipeline (PR-4, separate) is responsible for producing this
 * file plus the matching `*.zip` bundle and uploading both to COS.
 */
interface LiveUpdateManifest {
  /** Bundle version — must be strictly newer than what's currently running for the update to apply. Format: `major.minor.patch[.build]`. */
  version: string;
  /** Absolute https URL to the zipped bundle (zipped contents of `dist/`). */
  url: string;
  /** Base64-encoded sha256 of the zip. Plugin verifies before activating; mismatch aborts the install. */
  checksum: string;
  /** Lowest native shell version this bundle is compatible with. Skip silently when the installed native is below this — the version gate (`src/utils/versionGate.ts`) will hard-block the user separately. */
  min_native_version?: string;
}

const BASE = import.meta.env.VITE_LIVE_UPDATE_BASE_URL || 'https://cdn.acedata.cloud/nexior/updates';
const CHANNEL = (import.meta.env.VITE_LIVE_UPDATE_CHANNEL as string) || 'stable';
const ENABLED = String(import.meta.env.VITE_LIVE_UPDATE_ENABLED).toLowerCase() === 'true';

/**
 * Fire-and-forget OTA check at boot. The flow:
 *
 *  1. `notifyAppReady()` — mark the currently-running bundle as good so the
 *     plugin doesn't roll it back on next launch. MUST run on every cold
 *     start, regardless of whether we end up downloading anything.
 *  2. Fetch the platform-specific manifest from COS.
 *  3. If `manifest.min_native_version` is set and the installed native shell
 *     is older, skip — that scenario is handled by the version gate which
 *     forces a store upgrade.
 *  4. If `manifest.version` is newer than the currently active bundle's
 *     version (or the bundled `dist/` for first-run), download + queue for
 *     next launch via `set({id})`. We do NOT call `reload()` because mid-
 *     session reloads are jarring; the user picks up the new bundle the
 *     next time they cold-start the app.
 *
 * Fails open on every error. OTA must never wedge boot.
 */
export async function runLiveUpdate(): Promise<void> {
  if (!isNative()) return;
  // Even when disabled, fire `notifyAppReady` so older builds that DID
  // download a bundle won't get rolled back when this flag is flipped.
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch (err) {
    console.warn('[liveUpdate] notifyAppReady failed', err);
  }

  if (!ENABLED) {
    console.debug('[liveUpdate] disabled via VITE_LIVE_UPDATE_ENABLED');
    return;
  }

  const platform = isIOS() ? 'ios' : isAndroid() ? 'android' : null;
  if (!platform) return;

  let manifest: LiveUpdateManifest;
  try {
    const resp = await axios.get<LiveUpdateManifest>(`${BASE}/${CHANNEL}/${platform}.json`, {
      timeout: 8000,
      // Add a cache-buster — CDNs aggressively cache JSON otherwise.
      params: { t: Date.now() }
    });
    manifest = resp.data;
  } catch (err) {
    console.warn('[liveUpdate] manifest fetch failed', err);
    return;
  }

  if (!manifest?.version || !manifest?.url) {
    console.warn('[liveUpdate] manifest missing required fields', manifest);
    return;
  }

  if (manifest.min_native_version) {
    try {
      const info = await CapApp.getInfo();
      if (compareVersions(info.version, manifest.min_native_version) < 0) {
        console.info('[liveUpdate] native too old for this bundle; skipping');
        return;
      }
    } catch (err) {
      console.warn('[liveUpdate] App.getInfo failed; skipping bundle check', err);
      return;
    }
  }

  // Compare against the *currently active* bundle (which may be the builtin
  // dist/ on a fresh install — in that case `current().bundle.version`
  // reports the version baked into the native binary, e.g. "3.35.2").
  let currentVersion = '0.0.0';
  try {
    const current = await CapacitorUpdater.current();
    currentVersion = current.bundle?.version || '0.0.0';
  } catch (err) {
    console.warn('[liveUpdate] current() failed; assuming 0.0.0', err);
  }

  if (compareVersions(manifest.version, currentVersion) <= 0) {
    console.debug(`[liveUpdate] up to date (current=${currentVersion}, manifest=${manifest.version})`);
    return;
  }

  console.info(`[liveUpdate] downloading bundle ${manifest.version} (current=${currentVersion})`);
  try {
    const bundle = await CapacitorUpdater.download({
      url: manifest.url,
      version: manifest.version,
      checksum: manifest.checksum
    });
    await CapacitorUpdater.set({ id: bundle.id });
    console.info(`[liveUpdate] bundle ${manifest.version} queued for next launch`);
  } catch (err) {
    console.warn('[liveUpdate] download/set failed', err);
  }
}
