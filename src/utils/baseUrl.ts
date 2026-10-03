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
  if (!isNative() && !isDesktop() && typeof window !== 'undefined') {
    return window.location.origin || BASE_URL_STUDIO;
  }
  return import.meta.env.VITE_BASE_URL_STUDIO || BASE_URL_STUDIO;
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
