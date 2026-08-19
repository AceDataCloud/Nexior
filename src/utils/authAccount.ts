import { Browser } from '@capacitor/browser';
import { authOperator } from '@/operators/auth';
import { getBaseUrlAuth } from './baseUrl';
import { withCurrentSite } from './crossSiteUser';
import { isNative } from './surface';

const buildAuthLoginUrl = (path: string): string => {
  const accountUrl = new URL(withCurrentSite(new URL(path, getBaseUrlAuth()).toString()));
  const redirect = `${accountUrl.pathname}${accountUrl.search}${accountUrl.hash}`;
  const url = new URL('/auth/login/', getBaseUrlAuth());
  url.searchParams.set('redirect', redirect);
  return withCurrentSite(url.toString());
};

export const openAuthAccountPage = async (path: string): Promise<void> => {
  const fallbackUrl = buildAuthLoginUrl(path);
  const targetWindow = isNative() ? null : window.open('about:blank', '_blank');
  try {
    const { data } = await authOperator.getCode();
    const url = new URL(fallbackUrl);
    url.searchParams.set('code', data.code);
    if (isNative()) {
      await Browser.open({ url: url.toString() });
    } else if (targetWindow) {
      targetWindow.location.replace(url.toString());
    } else {
      window.location.href = url.toString();
    }
  } catch (error) {
    console.warn('failed to open Auth account page with SSO', error);
    if (isNative()) {
      await Browser.open({ url: fallbackUrl });
    } else if (targetWindow) {
      targetWindow.location.replace(fallbackUrl);
    } else {
      window.location.href = fallbackUrl;
    }
  }
};
