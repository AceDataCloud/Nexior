import { App as CapApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { ElMessageBox } from 'element-plus';
import { appVersionOperator } from '@/operators/appVersion';
import { isAndroid, isIOS, isNative, isDesktop } from '@/utils/surface';
import { desktopBridge } from '@/utils/desktop';
import { t, setI18nLanguage, getLocale } from '@/i18n';
// `__APP_VERSION__` is declared globally in shims.d.ts (vite `define`).

/**
 * Compare two dotted numeric version strings. Returns -1 / 0 / 1 like
 * String#localeCompare. Non-numeric segments compare as 0, missing
 * segments compare as 0 — enough for our `major.minor.patch` use.
 */
export function compareVersions(a: string, b: string): number {
  const pa = (a || '').split('.');
  const pb = (b || '').split('.');
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = parseInt(pa[i] || '0', 10) || 0;
    const nb = parseInt(pb[i] || '0', 10) || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

/**
 * Check the native build against backend metadata and, when the build is
 * below `min_supported`, block the app behind a modal that links to the
 * store. Soft prompt when below `latest`. Fail-open on any error.
 *
 * @returns true when boot should NOT continue (modal blocked the app),
 *          false otherwise.
 */
export async function runVersionGate(): Promise<boolean> {
  if (isDesktop()) return runDesktopVersionGate();
  if (!isNative()) return false;
  const platform = isIOS() ? 'ios' : isAndroid() ? 'android' : null;
  if (!platform) return false;

  let nativeVersion: string;
  try {
    const info = await CapApp.getInfo();
    nativeVersion = info.version;
  } catch (err) {
    console.warn('[versionGate] App.getInfo failed, skipping', err);
    return false;
  }

  let meta;
  try {
    const { data } = await appVersionOperator.get('nexior', platform);
    meta = data;
  } catch (err) {
    // Network errors, 404, etc. — never block the app on infra problems.
    console.warn('[versionGate] fetch failed, skipping', err);
    return false;
  }

  const belowMin = meta.min_supported && compareVersions(nativeVersion, meta.min_supported) < 0;
  const belowLatest = meta.latest && compareVersions(nativeVersion, meta.latest) < 0;

  if (belowMin) {
    // i18n strings used in the modal need the locale loaded — the router's
    // beforeEach hook hasn't run yet at this point in boot.
    try {
      await setI18nLanguage(getLocale());
    } catch (err) {
      console.warn('[versionGate] locale load failed, continuing with default', err);
    }
    await showBlockingUpgrade(meta.store_url, meta.message);
    return true;
  }
  if (belowLatest) {
    // Soft prompt: don't block boot. Fire-and-forget; the modal sits on top
    // of the app once it's mounted. Locale will already be set by then.
    void showSoftUpgrade(meta.store_url, meta.message);
  }
  return false;
}

async function showBlockingUpgrade(storeUrl: string, customMessage: string): Promise<void> {
  // Loop forever: the only way out is to update. Closing the WebView is the
  // user's only escape hatch, which is the intended UX.

  while (true) {
    try {
      await ElMessageBox.alert(
        customMessage || (t('common.appUpgrade.blockMessage') as string),
        t('common.appUpgrade.title') as string,
        {
          confirmButtonText: t('common.appUpgrade.openStore') as string,
          showClose: false,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          closeOnHashChange: false,
          type: 'warning'
        }
      );
    } catch {
      // Element Plus rejects the promise on close/cancel; treat as "user
      // tapped outside" and re-show. Combined with the disabled close
      // affordances above, this is purely a defensive guard.
    }
    if (storeUrl) {
      try {
        await Browser.open({ url: storeUrl });
      } catch (err) {
        console.warn('[versionGate] Browser.open failed', err);
      }
    }
  }
}

async function showSoftUpgrade(storeUrl: string, customMessage: string): Promise<void> {
  try {
    await ElMessageBox.confirm(
      customMessage || (t('common.appUpgrade.softMessage') as string),
      t('common.appUpgrade.title') as string,
      {
        confirmButtonText: t('common.appUpgrade.openStore') as string,
        cancelButtonText: t('common.appUpgrade.later') as string,
        type: 'info'
      }
    );
    if (storeUrl) await Browser.open({ url: storeUrl });
  } catch {
    // User dismissed — fine.
  }
}

/**
 * Desktop (Electron) version gate. electron-updater has no server-side
 * hard-block, so this is the out-of-band kill switch — the desktop equivalent
 * of the mobile gate above. Fails open whenever the version is unknown or the
 * metadata fetch fails (never brick the app on infra problems).
 *
 * Differences from mobile: version comes from the `__APP_VERSION__` build-time
 * global (not CapApp.getInfo), the store link opens via the desktop bridge in
 * the system browser, and the blocking modal is a single terminal prompt (not
 * a re-arming loop) — on desktop the user can always close the OS window.
 */
async function runDesktopVersionGate(): Promise<boolean> {
  const appVersion = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '';
  if (!appVersion) {
    console.warn('[versionGate] desktop version unknown, fail-open');
    return false;
  }

  let meta;
  try {
    const { data } = await appVersionOperator.get('nexior', 'desktop');
    meta = data;
  } catch (err) {
    console.warn('[versionGate] desktop fetch failed, skipping', err);
    return false;
  }

  const belowMin = meta.min_supported && compareVersions(appVersion, meta.min_supported) < 0;
  const belowLatest = meta.latest && compareVersions(appVersion, meta.latest) < 0;

  if (belowMin) {
    try {
      await setI18nLanguage(getLocale());
    } catch (err) {
      console.warn('[versionGate] locale load failed, continuing with default', err);
    }
    await showBlockingUpgradeDesktop(meta.store_url, meta.message);
    return true;
  }
  if (belowLatest) {
    void showSoftUpgradeDesktop(meta.store_url, meta.message);
  }
  return false;
}

async function showBlockingUpgradeDesktop(storeUrl: string, customMessage: string): Promise<void> {
  // Single terminal prompt (no while(true) loop — desktop has no "close the
  // WebView" escape hatch, so a re-arming modal would trap the user behind a
  // still-interactive window). Open the download page, then the user updates.
  try {
    await ElMessageBox.alert(
      customMessage || (t('common.appUpgrade.blockMessage') as string),
      t('common.appUpgrade.title') as string,
      {
        confirmButtonText: t('common.appUpgrade.openStore') as string,
        showClose: false,
        closeOnClickModal: false,
        closeOnPressEscape: false,
        type: 'warning'
      }
    );
  } catch {
    // Dismissed — still open the download page below.
  }
  if (storeUrl) await desktopBridge()?.openExternal(storeUrl);
}

async function showSoftUpgradeDesktop(storeUrl: string, customMessage: string): Promise<void> {
  try {
    await ElMessageBox.confirm(
      customMessage || (t('common.appUpgrade.softMessage') as string),
      t('common.appUpgrade.title') as string,
      {
        confirmButtonText: t('common.appUpgrade.openStore') as string,
        cancelButtonText: t('common.appUpgrade.later') as string,
        type: 'info'
      }
    );
    if (storeUrl) await desktopBridge()?.openExternal(storeUrl);
  } catch {
    // User dismissed — fine.
  }
}
