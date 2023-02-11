import { removeCookie } from 'typescript-cookie';

export const removeCookies = () => {
  const host = window.location.host;
  // process test env and prod env, for example:
  // auth.zhishuyun.com -> .zhishuyun.com
  // auth.test.zhishuyun.com -> .zhishuyun.com
  const domain = host.replace(/^\S+?\.(test\.|local\.)?/, '.');
  const path = '/';
  // remove tokens from cookies
  removeCookie('ACCESS_TOKEN', { domain, path });
  removeCookie('REFRESH_TOKEN', { domain, path });
};
