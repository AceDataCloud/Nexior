import { removeCookie, setCookie as baseSetCookie } from 'typescript-cookie';
import { CookieAttributes } from 'typescript-cookie/dist/types';

export const getDomain = () => {
  const host = window.location.host;
  // process test env and prod env, for example:
  // auth.zhishuyun.com -> .zhishuyun.com
  // auth.test.zhishuyun.com -> .zhishuyun.com
  const domain = host.replace(/^\S+?\.(test\.|local\.)?/, '.');
  return domain;
};

export const getPath = () => {
  return '/';
};

export const setCookie = (key: string, value: string, attributes: CookieAttributes) => {
  baseSetCookie(key, value, {
    domain: attributes?.domain || getDomain(),
    path: attributes?.path || getPath(),
    expires: attributes?.expires,
    sameSite: attributes?.sameSite,
    secure: attributes?.secure
  });
};

export const resetCookies = () => {
  // remove tokens from cookies
  removeCookie('ACCESS_TOKEN', { domain: getDomain(), path: getPath() });
  removeCookie('REFRESH_TOKEN', { domain: getDomain(), path: getPath() });
};
