import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({
  getters: { authenticated: false },
  state: { auth: { visible: false, reauthenticate: false } },
  dispatch: vi.fn()
}));

vi.mock('@/store', () => ({ default: store }));
vi.mock('./baseUrl', () => ({
  getBaseUrlAuth: () => 'https://auth.example.com',
  getBaseUrlStudio: () => window.location.origin
}));
vi.mock('typescript-cookie', () => ({ getCookie: vi.fn() }));

import { ensureLoggedIn, loginRedirect, requestReauthentication } from './login';

describe('ensureLoggedIn', () => {
  beforeEach(() => {
    store.getters.authenticated = false;
    store.state.auth.visible = false;
    store.state.auth.reauthenticate = false;
    store.dispatch.mockClear();
  });

  it('allows authenticated operations', () => {
    store.getters.authenticated = true;
    expect(ensureLoggedIn()).toBe(true);
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('starts login for a guest', () => {
    expect(ensureLoggedIn()).toBe(false);
    expect(store.dispatch).toHaveBeenCalledOnce();
    expect(store.dispatch).toHaveBeenCalledWith('login');
  });

  it('deduplicates concurrent login triggers', () => {
    store.state.auth.visible = true;
    expect(ensureLoggedIn()).toBe(false);
    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('encodes the complete return path inside the callback URL', () => {
    const location = { origin: 'https://20261002.studio.acedata.cloud', search: '', href: '' };
    vi.stubGlobal('window', { location });
    const redirect = '/chat/123?mode=music&lang=zh-CN#draft';
    loginRedirect({ redirect });
    const login = new URL(location.href);
    const callback = new URL(login.searchParams.get('redirect')!);
    expect(login.searchParams.get('site')).toBe(location.origin);
    expect(callback.origin).toBe(location.origin);
    expect(callback.searchParams.get('redirect')).toBe(redirect);
    expect(callback.hash).toBe('');
    expect(callback.searchParams.has('lang')).toBe(false);
    vi.unstubAllGlobals();
  });

  it('starts fresh login for an authenticated session and deduplicates an open ceremony', () => {
    store.getters.authenticated = true;
    requestReauthentication();
    expect(store.dispatch).toHaveBeenCalledWith('login', { reauthenticate: true });
    store.state.auth = { visible: true, reauthenticate: true };
    requestReauthentication();
    expect(store.dispatch).toHaveBeenCalledOnce();
  });

  it('uses the existing callback with fresh auth and a safe manual-retry return', () => {
    const location = { origin: 'https://studio.example.com', search: '', href: '' };
    vi.stubGlobal('window', { location });
    loginRedirect({ redirect: '/console/connectors?connect=github&tab=mine#devices', reauthenticate: true });
    const login = new URL(location.href);
    const callback = new URL(login.searchParams.get('redirect')!);
    expect(login.searchParams.get('reauthenticate')).toBe('1');
    expect(login.searchParams.has('code')).toBe(false);
    expect(callback.origin).toBe(location.origin);
    expect(callback.searchParams.get('redirect')).toBe('/console/connectors?tab=mine#devices');
    vi.unstubAllGlobals();
  });
});
