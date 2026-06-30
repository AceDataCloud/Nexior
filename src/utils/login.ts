import store from '@/store';
import { getBaseUrlAuth, getBaseUrlHub } from './baseUrl';
import { getCookie } from 'typescript-cookie';

export const getInviterId = () => {
  // if forceInviterId is set, then use forceInviterId
  if (store?.state?.site?.distribution?.force_inviter_id) {
    return store?.state?.site?.distribution?.force_inviter_id;
  }
  // parse the query string and set to cookies
  const query = new URLSearchParams(window.location.search);
  // Otherwise, use the inviter_id in the url, then use the inviter_id in the cookie, and finally use the default inviter_id
  const result =
    query.get('inviter_id') || getCookie('INVITER_ID') || store?.state?.site?.distribution?.default_inviter_id;
  return result;
};

export const loginRedirect = ({
  redirect = '/',
  site = window.location.origin
}: {
  redirect?: string;
  site?: string;
}) => {
  const hubBaseUrl = getBaseUrlHub();
  const authBaseUrl = getBaseUrlAuth();
  const inviterId = getInviterId();
  // callback url used to init access token and then redirect back of `redirect`
  const callbackUrl = `${hubBaseUrl}/auth/callback?redirect=${redirect}`;
  // redirect to auth service to get access token then redirect back
  // Trailing slash is required: `/auth/login` 301-redirects to a cleartext
  // `http://.../auth/login/`, which iOS ATS blocks (white screen in the native
  // login iframe). The canonical `/auth/login/` returns 200 directly.
  const targetBaseUrl = `${authBaseUrl}/auth/login/`;
  const targetQuery = {
    site,
    ...(inviterId ? { inviter_id: inviterId } : {}),
    ...(callbackUrl ? { redirect: callbackUrl } : {})
  };
  const targetUrl = `${targetBaseUrl}?${new URLSearchParams(targetQuery).toString()}`;
  window.location.href = targetUrl;
};

/**
 * Gate a user-initiated operation behind login. Returns `true` when the user is
 * already authenticated; otherwise kicks off the login flow (in-app popup on
 * native/desktop, redirect on web — preserving the current URL) and returns
 * `false` so the caller can abort the just-attempted operation.
 *
 * This is the "deferred auth" primitive: guests can browse and compose, and are
 * only sent to login the moment they actually try to run something.
 */
export const ensureLoggedIn = (): boolean => {
  if (store.getters.authenticated) {
    return true;
  }
  store.dispatch('login');
  return false;
};
