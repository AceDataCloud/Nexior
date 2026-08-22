import { Browser } from '@capacitor/browser';
import { getBaseUrlAuth } from './baseUrl';
import { isNative } from './surface';
import { withAuthFrontendSession } from './authHandoff';

export const openAuthAccountPage = async (path: string): Promise<void> => {
  const targetUrl = new URL(path, getBaseUrlAuth()).toString();
  const targetWindow = isNative() ? null : window.open('about:blank', '_blank');
  const handoffUrl = await withAuthFrontendSession(targetUrl);
  if (isNative()) {
    await Browser.open({ url: handoffUrl });
  } else if (targetWindow) {
    targetWindow.location.replace(handoffUrl);
  } else {
    window.location.href = handoffUrl;
  }
};
