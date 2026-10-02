import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = vi.hoisted(() => ({
  getters: { authenticated: false },
  state: { auth: { visible: false } },
  dispatch: vi.fn()
}));

vi.mock('@/store', () => ({ default: store }));
vi.mock('./baseUrl', () => ({
  getBaseUrlAuth: () => 'https://auth.example.com',
  getBaseUrlStudio: () => 'https://studio.example.com'
}));
vi.mock('typescript-cookie', () => ({ getCookie: vi.fn() }));

import { ensureLoggedIn, loginRedirect } from './login';

describe('ensureLoggedIn', () => {
  beforeEach(() => {
    store.getters.authenticated = false;
    store.state.auth.visible = false;
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
    const callback = new URL(new URL(location.href).searchParams.get('redirect')!);
    expect(callback.searchParams.get('redirect')).toBe(redirect);
    expect(callback.hash).toBe('');
    expect(callback.searchParams.has('lang')).toBe(false);
    vi.unstubAllGlobals();
  });
});
