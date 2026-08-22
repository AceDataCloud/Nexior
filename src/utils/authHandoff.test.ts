// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getCode = vi.hoisted(() => vi.fn());

vi.mock('@/operators/auth', () => ({
  authOperator: { getCode }
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

import { buildAuthLoginUrl, isAuthFrontendUrl, withAuthFrontendSession } from './authHandoff';

const AUTH_TARGET =
  'https://auth.acedata.cloud/oauth2/authorize?client_id=serp&redirect_uri=https%3A%2F%2Fserp.example%2Fcallback#consent';

describe('AuthFrontend session handoff', () => {
  beforeEach(() => {
    getCode.mockReset();
  });

  it('recognizes only the exact AuthFrontend origin', () => {
    expect(isAuthFrontendUrl(AUTH_TARGET)).toBe(true);
    expect(isAuthFrontendUrl('https://auth.acedata.cloud.evil.example/oauth2/authorize')).toBe(false);
    expect(isAuthFrontendUrl('https://evil.example/?next=https://auth.acedata.cloud')).toBe(false);
    expect(isAuthFrontendUrl('not a url')).toBe(false);
  });

  it('puts the white-label site on both the login page and its redirect target', () => {
    const login = new URL(buildAuthLoginUrl(AUTH_TARGET));
    const redirect = new URL(login.searchParams.get('redirect') || '', login.origin);

    expect(login.pathname).toBe('/auth/login/');
    expect(login.searchParams.get('site')).toBe('https://studio.worldai.chat');
    expect(redirect.pathname).toBe('/oauth2/authorize');
    expect(redirect.searchParams.get('client_id')).toBe('serp');
    expect(redirect.searchParams.get('site')).toBe('https://studio.worldai.chat');
    expect(redirect.hash).toBe('#consent');
  });

  it('adds a one-time SSO code before entering an Auth-hosted authorize page', async () => {
    getCode.mockResolvedValue({ data: { code: 'single-use-code' } });

    const login = new URL(await withAuthFrontendSession(AUTH_TARGET));

    expect(getCode).toHaveBeenCalledOnce();
    expect(login.searchParams.get('code')).toBe('single-use-code');
  });

  it('falls back to normal Auth login when code minting fails', async () => {
    getCode.mockRejectedValue(new Error('expired session'));

    const login = new URL(await withAuthFrontendSession(AUTH_TARGET));

    expect(login.pathname).toBe('/auth/login/');
    expect(login.searchParams.has('code')).toBe(false);
    expect(login.searchParams.get('redirect')).toContain('/oauth2/authorize');
  });

  it('leaves external OAuth providers untouched without requesting a code', async () => {
    const external = 'https://accounts.google.com/o/oauth2/auth?client_id=x';

    await expect(withAuthFrontendSession(external)).resolves.toBe(external);
    expect(getCode).not.toHaveBeenCalled();
  });
});
