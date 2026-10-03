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
import { getCookie } from 'typescript-cookie';

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

it('carries all campaign labels outside the encoded callback without altering the return path', () => {
  const location = { origin: 'https://studio.acedata.cloud', search: '', href: '' };
  const tags: Record<string, string> = {
    UTM_SOURCE: 'github',
    UTM_MEDIUM: 'readme',
    UTM_CAMPAIGN: 'opensource_activation',
    UTM_CONTENT: 'quick_start'
  };
  vi.mocked(getCookie).mockImplementation((name) => tags[name]);
  vi.stubGlobal('window', { location });
  loginRedirect({ redirect: '/suno?draft=1#music' });
  const target = new URL(location.href);
  expect(target.searchParams.get('utm_content')).toBe('quick_start');
  expect(target.searchParams.get('utm_source')).toBe('github');
  const callback = new URL(target.searchParams.get('redirect')!);
  expect(callback.searchParams.get('redirect')).toBe('/suno?draft=1#music');
  expect(callback.searchParams.has('utm_content')).toBe(false);
  vi.mocked(getCookie).mockReset();
  vi.unstubAllGlobals();
});
