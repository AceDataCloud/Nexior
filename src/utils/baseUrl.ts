import { BASE_URL_AUTH, BASE_URL_PLATFORM, BASE_URL_HUB } from '@/constants';

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
 * Get base url of hub app
 * @returns
 */
export const getBaseUrlHub = () => {
  if (import.meta.env.VITE_BASE_URL_HUB) {
    return import.meta.env.VITE_BASE_URL_HUB;
  }
  return window.location.origin || BASE_URL_HUB;
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
