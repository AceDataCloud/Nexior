import { getBaseUrlAuth, getBaseUrlHub } from './baseUrl';

export const login = (redirectUrl: string = '/') => {
  const hubBaseUrl = getBaseUrlHub();
  const authBaseUrl = getBaseUrlAuth();
  // callback url used to init access token and then redirect back of `redirect`
  const callbackUrl = `${hubBaseUrl}/auth/callback?redirect=${redirectUrl}`;
  // redirect to auth service to get access token then redirect back
  const targetUrl = `${authBaseUrl}/auth/login?redirect=${callbackUrl}`;
  window.location.href = targetUrl;
};
