import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAcquisitionContext } from '@acedatacloud/core/attribution';

vi.mock('@/store', () => ({ default: {} }));
vi.mock('./auth/accountSessions', () => ({ isAddingAccount: () => false }));
vi.mock('typescript-cookie', () => ({ getCookie: () => 'en', setCookie: vi.fn() }));
vi.mock('./theme', () => ({ applyAccentColor: vi.fn(), applyThemePreference: vi.fn() }));
vi.mock('@/i18n', () => ({ getLocale: () => 'en' }));
vi.mock('./is', () => ({ isWechatBrowser: () => false }));
vi.mock('./domain', () => ({ getDomain: () => '.acedata.cloud' }));

import { initializeCookies } from './initializer';

describe('Studio signup acquisition initialization', () => {
  let cookies: Map<string, string>;
  let location: { hostname: string; search: string };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-12T00:00:00Z'));
    cookies = new Map();
    location = {
      hostname: 'studio.acedata.cloud',
      search: '?utm_source=google&utm_medium=cpc&utm_campaign=studio_launch&utm_content=setup'
    };
    vi.stubGlobal('window', { location });
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('localStorage', { getItem: () => null });
    vi.stubGlobal('document', {
      get cookie() {
        return [...cookies].map(([key, value]) => `${key}=${value}`).join('; ');
      },
      set cookie(value: string) {
        const [pair, ...attributes] = value.split(';');
        expect(attributes).toContain('domain=.acedata.cloud');
        expect(attributes).toContain('Secure');
        const index = pair.indexOf('=');
        const key = pair.slice(0, index);
        if (attributes.includes('max-age=0')) cookies.delete(key);
        else cookies.set(key, pair.slice(index + 1));
      }
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const authRead = (cookies: Map<string, string>) =>
    createAcquisitionContext({
      cookies: {
        get: (key) => {
          const value = cookies.get(key);
          return value ? decodeURIComponent(value) : undefined;
        },
        set: vi.fn(),
        remove: (key) => cookies.delete(key)
      },
      allowed: () => true
    }).read(new URLSearchParams());

  it.each(['studio.acedata.cloud', '20261012.studio.acedata.cloud'])(
    'retains direct-entry tags for Auth after untagged navigation on %s',
    async (hostname) => {
      location.hostname = hostname;
      await initializeCookies();
      location.search = '';
      vi.advanceTimersByTime(60000);
      await initializeCookies();
      expect(authRead(cookies)).toEqual({
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'studio_launch',
        utm_content: 'setup',
        utm_captured_at: '2026-10-12T00:00:00.000Z'
      });
    }
  );

  it('replaces a previous campaign instead of mixing attribution labels', async () => {
    await initializeCookies();
    location.search = '?utm_source=github';
    await initializeCookies();
    expect(authRead(cookies)).toEqual({ utm_source: 'github', utm_captured_at: '2026-10-12T00:00:00.000Z' });
  });

  it.each(['dnt', 'gpc', 'consent'])('honors %s and clears old acquisition context', async (mode) => {
    await initializeCookies();
    vi.stubGlobal('navigator', { doNotTrack: mode === 'dnt' ? '1' : undefined, globalPrivacyControl: mode === 'gpc' });
    vi.stubGlobal('localStorage', { getItem: () => (mode === 'consent' ? 'denied' : null) });
    await initializeCookies();
    expect(authRead(cookies)).toEqual({});
  });

  it.each(['tenant.example', 'localhost', 'bundle'])('does not capture on custom or app host %s', async (hostname) => {
    location.hostname = hostname;
    await initializeCookies();
    expect(authRead(cookies)).toEqual({});
  });

  it('fails closed when browser storage is unavailable', async () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('unavailable');
      }
    });
    await expect(initializeCookies()).resolves.toBeUndefined();
    expect(authRead(cookies)).toEqual({});
  });
});
