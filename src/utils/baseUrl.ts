import { BASE_URL_AUTH, BASE_URL_PLATFORM, BASE_URL_STUDIO } from '@/constants';
import { isNative, isDesktop } from './surface';

/**
 * Get base url of platform app
 * @returns
 */
export const getBaseUrlPlatform = () => {
  if (import.meta.env.VITE_BASE_URL_PLATFORM) {
    return import.meta.env.VITE_BASE_URL_PLATFORM;
  }
  return BASE_URL_PLATFORM;
};

/**
 * Get base URL of Studio
 * @returns
 */
export const getBaseUrlStudio = () => {
  if (import.meta.env.VITE_BASE_URL_STUDIO) {
    return import.meta.env.VITE_BASE_URL_STUDIO;
  }
  // On native platforms (Capacitor) window.location.origin is http://localhost,
  // and on desktop (Electron) it is app://bundle — neither is the real Studio URL,
  // so use the hardcoded constant instead.
  if (isNative() || isDesktop()) {
    return BASE_URL_STUDIO;
  }
  return window.location.origin || BASE_URL_STUDIO;
};

/**
 * Get base url of auth app
 * @returns
 */
export const getBaseUrlAuth = () => {
  if (import.meta.env.VITE_BASE_URL_AUTH) {
    return import.meta.env.VITE_BASE_URL_AUTH;
  }
  return BASE_URL_AUTH;
};
