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
 * isMainOfficial
 *
 * Strict check for the bare official main host (currently
 * ``studio.acedata.cloud``). Unlike ``isOfficial()``, this returns
 * ``false`` for any subsite (``*.studio.acedata.cloud``) and for
 * white-label tenants on custom domains. Use this for surfaces that
 * should ONLY appear on the parent / commercial origin — e.g. the
 * subsite-management entry in the user-settings dialog.
 */
export const isMainOfficial = (): boolean => {
  if (typeof window === 'undefined' || !window.location?.host) return false;
  const host = window.location.host.split(':')[0].toLowerCase();
  return host === 'studio.acedata.cloud';
};

/**
 * currentSiteOrigin
 *
 * Bare host of the calling Site (e.g. ``studio.acedata.cloud``,
 * ``my-brand.studio.acedata.cloud``), lower-cased and with any port
 * stripped. Returns the empty string in non-browser contexts.
 *
 * The aichat2 worker uses this value (sent via the ``x-site-origin``
 * header) to scope per-Site state such as BYOK credentials, so the
 * same user can keep separate keys on the main site and on each
 * subsite they administer.
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
