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
 */
export const isOfficial = (): boolean => {
  return window.location.host.includes(BASE_HOST_HUB);
};

/**
 * isSubOfficial
 */
export const isSubOfficial = (): boolean => {
  return isOfficial() && window.location.host !== BASE_HOST_HUB;
};
