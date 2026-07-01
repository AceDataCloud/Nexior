import { SURFACE_ANDROID, SURFACE_IOS, SURFACE_WEB, SURFACE_DESKTOP } from '@/constants/surface';

type Surface = typeof SURFACE_WEB | typeof SURFACE_ANDROID | typeof SURFACE_IOS | typeof SURFACE_DESKTOP;

export function getSurface(): Surface {
  const value = (import.meta.env.VITE_SURFACE as string | undefined) ?? SURFACE_WEB;
  // NOTE: previously any unknown value silently coerced to 'web'. We now
  // recognize 'desktop' explicitly; everything else still falls back to web.
  if (value === SURFACE_IOS || value === SURFACE_ANDROID || value === SURFACE_DESKTOP) {
    return value;
  }
  return SURFACE_WEB;
}

export function isIOS(): boolean {
  return getSurface() === SURFACE_IOS;
}

export function isAndroid(): boolean {
  return getSurface() === SURFACE_ANDROID;
}

export function isDesktop(): boolean {
  return getSurface() === SURFACE_DESKTOP;
}

/**
 * Surfaces that can run aichat2 client-side tools locally: the desktop Electron
 * bridge (`window.localExec` from preload, full fs/shell/computer) and Android
 * (`window.localExec` adapter backed by the AccessibilityService Computer Use
 * plugin, computer.* only). Web + iOS return false → chat behaves exactly as
 * before. The actual bridge is still null-checked at every call site, so an
 * Android build without the capability (adapter not installed) is a no-op.
 */
export function supportsClientTools(): boolean {
  return isDesktop() || isAndroid();
}

/**
 * The desktop OS, distinguished at RUNTIME via the Electron preload bridge
 * (`window.desktop.platform` = process.platform). The renderer bundle is
 * identical for Windows and macOS — they share one `VITE_SURFACE=desktop`
 * build — so the OS is a runtime property, not a build surface. Used for the
 * per-OS version gate, download links, and update feed selection.
 * Returns undefined off-desktop (web/native).
 */
export function getDesktopOS(): 'windows' | 'mac' | undefined {
  const platform = typeof window !== 'undefined' ? window.desktop?.platform : undefined;
  if (platform === 'win32') return 'windows';
  if (platform === 'darwin') return 'mac';
  return undefined;
}

export function isWindows(): boolean {
  return getDesktopOS() === 'windows';
}

export function isMacOS(): boolean {
  return getDesktopOS() === 'mac';
}

// UNCHANGED MEANING: native === "Capacitor mobile shell" (iOS or Android).
// Desktop is deliberately NOT native — it must not hit IAP/push/Capacitor-OTA.
export function isNative(): boolean {
  const surface = getSurface();
  return surface === SURFACE_IOS || surface === SURFACE_ANDROID;
}

export function isWeb(): boolean {
  return getSurface() === SURFACE_WEB;
}

export function isMobile(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|android|windows phone/i.test(ua);
}

// AliPay's backend issues different URLs for Page (PC) vs Wap (mobile web).
// Native apps still want their own "ios" / "android" surface so the backend
// can pick the right SDK path. Otherwise mobile-web users receive a PC Page
// URL and have to deal with a desktop-sized form.
export function getPaymentSurface(): 'pc' | 'wap' | 'ios' | 'android' {
  if (isIOS()) return 'ios';
  if (isAndroid()) return 'android';
  // Desktop: explicit. Electron's UA is desktop-Chromium so without this it
  // would fall through to 'pc' anyway, but pin it so the intent is clear and
  // a future UA-sniff change can't accidentally hand desktop a 'wap' Page.
  // 'pc' is the right backend surface (AliPay Page / Stripe web); the redirect
  // itself must be opened in the system browser (handled in the Electron shell).
  if (isDesktop()) return 'pc';
  return isMobile() ? 'wap' : 'pc';
}
