// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { getCode, native, desktop } = vi.hoisted(() => ({
  getCode: vi.fn(),
  native: { value: false },
  desktop: { value: false }
}));

vi.mock('@/operators/auth', () => ({ authOperator: { getCode } }));
vi.mock('./baseUrl', () => ({ getBaseUrlAuth: () => 'https://auth.acedata.cloud' }));
vi.mock('./crossSiteUser', () => ({
  withCurrentSite: (url: string) => {
    const target = new URL(url);
    target.searchParams.set('site', 'https://studio.worldai.chat');
    return target.toString();
  }
}));
vi.mock('./surface', () => ({
  isNative: () => native.value,
  isDesktop: () => desktop.value
}));

import {
  buildAuthLoginUrl,
  buildConnectorContinuationUrl,
  getConnectorSiteOrigin,
  isAuthFrontendUrl,
  prepareConnectorAuthorizationUrl,
  withAuthFrontendSession
} from './authHandoff';

const AUTH_TARGET = 'https://auth.acedata.cloud/oauth2/authorize?client_id=serp';
const CONTEXT7_TARGET = 'https://clerk.context7.com/oauth/authorize?client_id=context7';

describe('AuthFrontend session handoff', () => {
  beforeEach(() => {
    getCode.mockReset();
    native.value = false;
    desktop.value = false;
  });

  it('recognizes only the exact AuthFrontend origin', () => {
    expect(isAuthFrontendUrl(AUTH_TARGET)).toBe(true);
    expect(isAuthFrontendUrl('https://auth.acedata.cloud.evil.example/oauth2/authorize')).toBe(false);
    expect(isAuthFrontendUrl('not a url')).toBe(false);
  });

  it('reports the current web origin but omits native and desktop pseudo-origins', () => {
    expect(getConnectorSiteOrigin()).toBe(window.location.origin);
    native.value = true;
    expect(getConnectorSiteOrigin()).toBeUndefined();
    native.value = false;
    desktop.value = true;
    expect(getConnectorSiteOrigin()).toBeUndefined();
  });

  it('builds a token-only Auth continuation without exposing the target', () => {
    const continuation = new URL(buildConnectorContinuationUrl('signed-token') || '');
    expect(continuation.origin).toBe('https://auth.acedata.cloud');
    expect(continuation.pathname).toBe('/connections/continue');
    expect(continuation.searchParams.get('handoff')).toBe('signed-token');
    expect(continuation.searchParams.get('site')).toBe('https://studio.worldai.chat');
    expect(continuation.searchParams.has('target')).toBe(false);
  });

  it('puts the white-label site on both the login page and its redirect target', () => {
    const login = new URL(buildAuthLoginUrl(AUTH_TARGET));
    const redirect = new URL(login.searchParams.get('redirect') || '', login.origin);
    expect(login.searchParams.get('site')).toBe('https://studio.worldai.chat');
    expect(redirect.searchParams.get('site')).toBe('https://studio.worldai.chat');
  });

  it('routes a signed Context7 target through Auth without leaking code to Clerk', async () => {
    getCode.mockResolvedValue({ data: { code: 'single-use-code' } });
    const login = new URL(await prepareConnectorAuthorizationUrl(CONTEXT7_TARGET, 'signed-handoff'));
    const redirect = new URL(login.searchParams.get('redirect') || '', login.origin);

    expect(login.pathname).toBe('/auth/login/');
    expect(login.searchParams.get('code')).toBe('single-use-code');
    expect(redirect.pathname).toBe('/connections/continue');
    expect(redirect.searchParams.get('handoff')).toBe('signed-handoff');
    expect(CONTEXT7_TARGET).not.toContain('single-use-code');
  });

  it('keeps old-backend external OAuth responses unchanged without a handoff token', async () => {
    await expect(prepareConnectorAuthorizationUrl(CONTEXT7_TARGET)).resolves.toBe(CONTEXT7_TARGET);
    expect(getCode).not.toHaveBeenCalled();
  });

  it('adds a one-time SSO code before entering a direct Auth-hosted page', async () => {
    getCode.mockResolvedValue({ data: { code: 'single-use-code' } });
    const login = new URL(await withAuthFrontendSession(AUTH_TARGET));
    expect(login.searchParams.get('code')).toBe('single-use-code');
  });

  it('falls back to normal Auth login when code minting fails', async () => {
    getCode.mockRejectedValue(new Error('expired session'));
    const login = new URL(await withAuthFrontendSession(AUTH_TARGET));
    expect(login.pathname).toBe('/auth/login/');
    expect(login.searchParams.has('code')).toBe(false);
  });
});
