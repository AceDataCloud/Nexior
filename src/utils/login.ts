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
  const targetBaseUrl = `${authBaseUrl}/auth/login`;
  const targetQuery = {
    site,
    ...(inviterId ? { inviter_id: inviterId } : {}),
    ...(callbackUrl ? { redirect: callbackUrl } : {})
  };
  const targetUrl = `${targetBaseUrl}?${new URLSearchParams(targetQuery).toString()}`;
  window.location.href = targetUrl;
};
