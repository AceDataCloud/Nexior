import store from '@/store';
import { getBaseUrlAuth, getBaseUrlStudio } from './baseUrl';
import { getCookie } from 'typescript-cookie';
import { authReturnPath } from './auth/returnPath';

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
  addAccount = false,
  reauthenticate = false
}: {
  redirect?: string;
  addAccount?: boolean;
  reauthenticate?: boolean;
}) => {
  const studioBaseUrl = getBaseUrlStudio();
  const authBaseUrl = getBaseUrlAuth();
  const inviterId = getInviterId();
  // callback url used to init access token and then redirect back of `redirect`
  const callbackUrl = `${studioBaseUrl}/auth/callback?${new URLSearchParams({
    redirect: authReturnPath(redirect, reauthenticate)
  }).toString()}`;
  // redirect to auth service to get access token then redirect back
  // Trailing slash is required: `/auth/login` 301-redirects to a cleartext
  // `http://.../auth/login/`, which iOS ATS blocks (white screen in the native
  // login iframe). The canonical `/auth/login/` returns 200 directly.
  const targetBaseUrl = `${authBaseUrl}/auth/login/`;
  const targetQuery = {
    site: studioBaseUrl,
    ...(reauthenticate ? { reauthenticate: '1' } : {}),
    ...(inviterId ? { inviter_id: inviterId } : {}),
    ...(callbackUrl ? { redirect: callbackUrl } : {})
  };
  const targetUrl = `${targetBaseUrl}?${new URLSearchParams(targetQuery).toString()}`;
  window.location.href = addAccount
    ? `${authBaseUrl}/auth/logout?${new URLSearchParams({ redirect: targetUrl }).toString()}`
    : targetUrl;
};

/** Start a fresh identity/MFA ceremony; the rejected operation remains rejected. */
export const requestReauthentication = (): void => {
  if (store.state.auth?.visible && store.state.auth.reauthenticate) return;
  void store.dispatch('login', { reauthenticate: true });
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
  if (!store.state.auth?.visible) {
    store.dispatch('login');
  }
  return false;
};
