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
