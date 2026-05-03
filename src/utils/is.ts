/**
 * Js JSON string
 */

import { BASE_HOST_HUB } from '@/constants';

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
 * Returns true when the visitor is on one of the first-party Ace Data Cloud
 * hostnames. The Nexior bundle is also served from `studio.acedata.cloud`
 * (a separate ingress that runs the same image independently), so both hosts
 * must be treated as "official" — otherwise white-label / site-tenant logic
 * would incorrectly kick in on studio.acedata.cloud.
 */
export const isOfficial = (): boolean => {
  const host = window.location.host;
  return host.includes(BASE_HOST_HUB) || host.includes('studio.acedata.cloud');
};

/**
 * isSubOfficial
 */
export const isSubOfficial = (): boolean => {
  return isOfficial() && window.location.host !== BASE_HOST_HUB;
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
