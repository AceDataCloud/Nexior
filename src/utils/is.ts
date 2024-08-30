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
  return /micromessenger/i.test(navigator.userAgent);
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
