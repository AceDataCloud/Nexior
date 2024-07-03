import { getBaseUrlAuth, getBaseUrlHub } from './baseUrl';

export const login = ({ redirect = '/', site = window.location.origin }: { redirect?: string; site?: string }) => {
  const hubBaseUrl = getBaseUrlHub();
  const authBaseUrl = getBaseUrlAuth();
  // callback url used to init access token and then redirect back of `redirect`
  const callbackUrl = `${hubBaseUrl}/auth/callback?redirect=${redirect}`;
  // redirect to auth service to get access token then redirect back
  const targetUrl = `${authBaseUrl}/auth/login?redirect=${callbackUrl}&site=${site}`;
  window.location.href = targetUrl;
};
