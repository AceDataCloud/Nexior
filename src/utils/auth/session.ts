import store from '@/store';
import { getBaseUrlAuth } from '../baseUrl';
import { officialSiteHost } from '../officialHost';
import { isNative, isDesktop } from '../surface';
import { isAddingAccount } from './accountSessions';

export const requestSessionCode = (baseUrl: string, timeoutMs = 8000): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    const url = new URL('/auth/session', baseUrl);
    const requestId = crypto.randomUUID();
    url.searchParams.set('origin', window.location.origin);
    url.searchParams.set('request_id', requestId);
    iframe.hidden = true;
    iframe.referrerPolicy = 'origin';
    const finish = (code?: string) => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      iframe.remove();
      resolve(code);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== url.origin || event.source !== iframe.contentWindow) return;
      if (event.data?.name !== 'auth-session' || event.data?.request_id !== requestId) return;
      const code = event.data?.code;
      finish(typeof code === 'string' && code ? code : undefined);
    };
    const timer = setTimeout(() => finish(), timeoutMs);
    window.addEventListener('message', onMessage);
    iframe.onerror = () => finish();
    iframe.src = url.toString();
    document.body.appendChild(iframe);
  });
};

export const restoreSession = async (): Promise<void> => {
  if (isNative() || isDesktop()) return;
  const host = window.location.hostname;
  if (officialSiteHost(host, 'studio.acedata.cloud') !== 'studio.acedata.cloud') return;
  if (store.state.token?.access || isAddingAccount() || window.location.pathname.startsWith('/auth/')) return;
  if (new URLSearchParams(window.location.search).has('code')) return;
  try {
    const code = await requestSessionCode(getBaseUrlAuth());
    if (code && !store.state.token?.access && !isAddingAccount()) {
      await store.dispatch('getToken', code);
    }
  } catch {
    return;
  }
};
