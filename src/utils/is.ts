/**
 * Js JSON string
 */

import { BASE_HOST_STUDIO } from '@/constants';

export const hasMeaningfulText = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isJSONString = (str: string): boolean => {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
};

/**
 * Check if the string is wechat browser
 */
export const isWechatBrowser = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.includes('micromessenger');
};

/**
 * isOfficial
 *
 * Returns true only for Studio's apex and subdomains. Exact suffix matching
 * avoids treating sibling domains such as `evil-studio.acedata.cloud` as official.
 */
export const isOfficial = (): boolean => {
  const host = window.location.hostname.toLowerCase();
  return host === BASE_HOST_STUDIO || host.endsWith(`.${BASE_HOST_STUDIO}`);
};

/**
 * isSubOfficial
 */
export const isSubOfficial = (): boolean => {
  return isOfficial() && window.location.hostname.toLowerCase() !== BASE_HOST_STUDIO;
};

export const isMainOfficial = (
  host = typeof window === 'undefined' ? '' : window.location.host.split(':')[0]
): boolean => /^(?:20\d{6}\.)?studio\.acedata\.cloud$/.test(host.toLowerCase());

/**
 * currentSiteOrigin
 *
 * Bare host of the calling Site (e.g. ``studio.acedata.cloud``,
 * ``my-brand.studio.acedata.cloud``), lower-cased and with any port
 * stripped. Returns the empty string in non-browser contexts.
 *
 * The aichat2 worker uses this value (sent via the ``x-site-origin``
 * header) to isolate per-site state such as memories and conversations.
 */
export const currentSiteOrigin = (): string => {
  if (typeof window === 'undefined' || !window.location?.host) return '';
  return window.location.host.split(':')[0].toLowerCase();
};

/**
 * is image url
 */
export function isImageUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg|tiff|ico|heic?)$/i.test(url.toLowerCase());
}

/**
 * is video url
 */
export function isVideoUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return /\.(mp4|mov|webm|mkv|avi|m4v|flv)$/i.test(url.toLowerCase());
}

/**
 * is audio url
 */
export function isAudioUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return /\.(mp3|wav|m4a|aac|ogg|flac|weba)$/i.test(url.toLowerCase());
}
