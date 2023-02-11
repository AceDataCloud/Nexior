/**
 * Get verification url
 * @returns
 */

import { getAuthBaseUrl } from './baseUrl';

export const getVerificationUrl = () => {
  const baseUrl = getAuthBaseUrl();
  const targetUrl = `${baseUrl}/user/verify?redirect=` + window.location.href;
  return targetUrl;
};
