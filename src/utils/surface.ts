import { SURFACE_ANDROID, SURFACE_IOS, SURFACE_WEB } from '@/constants/surface';

type Surface = typeof SURFACE_WEB | typeof SURFACE_ANDROID | typeof SURFACE_IOS;

export function getSurface(): Surface {
  const value = (import.meta.env.VITE_SURFACE as string | undefined) ?? SURFACE_WEB;
  return value === SURFACE_IOS || value === SURFACE_ANDROID ? value : SURFACE_WEB;
}

export function isIOS(): boolean {
  return getSurface() === SURFACE_IOS;
}

export function isAndroid(): boolean {
  return getSurface() === SURFACE_ANDROID;
}

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
  return isMobile() ? 'wap' : 'pc';
}
