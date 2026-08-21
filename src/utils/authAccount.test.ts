// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { browserOpen, getCode, native } = vi.hoisted(() => ({
  getCode: vi.fn(),
  browserOpen: vi.fn(),
  native: { value: false }
}));

vi.mock('@/operators/auth', () => ({
  authOperator: { getCode }
}));
vi.mock('@capacitor/browser', () => ({
  Browser: { open: browserOpen }
}));
vi.mock('./baseUrl', () => ({
  getBaseUrlAuth: () => 'https://auth.acedata.cloud'
}));
vi.mock('./crossSiteUser', () => ({
  withCurrentSite: (url: string) => {
    const target = new URL(url);
    target.searchParams.set('site', 'https://studio.worldai.chat');
    return target.toString();
  }
}));
vi.mock('./surface', () => ({
  isNative: () => native.value
}));

import { openAuthAccountPage } from './authAccount';

describe('Auth account SSO navigation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    getCode.mockReset();
    browserOpen.mockReset();
    native.value = false;
  });

  it('opens a web tab synchronously and replaces it with an SSO login URL', async () => {
    const replace = vi.fn();
    const open = vi.spyOn(window, 'open').mockReturnValue({ location: { replace } } as unknown as Window);
    getCode.mockResolvedValue({ data: { code: 'single-use-code' } });

    const promise = openAuthAccountPage('/user/profile');

    expect(open).toHaveBeenCalledWith('about:blank', '_blank');
    await promise;
    const url = new URL(replace.mock.calls[0][0]);
    expect(url.pathname).toBe('/auth/login/');
    expect(url.searchParams.get('code')).toBe('single-use-code');
    expect(url.searchParams.get('site')).toBe('https://studio.worldai.chat');
    expect(url.searchParams.get('redirect')).toContain('/user/profile');
  });

  it('sends a failed web handoff to the normal login fallback', async () => {
    const replace = vi.fn();
    vi.spyOn(window, 'open').mockReturnValue({ location: { replace } } as unknown as Window);
    getCode.mockRejectedValue(new Error('expired session'));

    await openAuthAccountPage('/user/verify');

    const url = new URL(replace.mock.calls[0][0]);
    expect(url.searchParams.has('code')).toBe(false);
    expect(url.searchParams.get('redirect')).toContain('/user/verify');
  });

  it('uses the Capacitor browser without opening a web tab', async () => {
    native.value = true;
    const open = vi.spyOn(window, 'open');
    getCode.mockResolvedValue({ data: { code: 'native-code' } });

    await openAuthAccountPage('/user/profile');

    expect(open).not.toHaveBeenCalled();
    expect(browserOpen).toHaveBeenCalledOnce();
    expect(browserOpen.mock.calls[0][0].url).toContain('code=native-code');
  });
});
