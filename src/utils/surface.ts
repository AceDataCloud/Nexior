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
