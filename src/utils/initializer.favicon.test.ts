// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  site: {} as { favicon?: string }
}));

vi.mock('@/store', () => ({
  default: {
    state: {
      get site() {
        return mocks.site;
      }
    }
  }
}));
vi.mock('typescript-cookie', () => ({ getCookie: vi.fn(), setCookie: vi.fn() }));
vi.mock('./theme', () => ({ applyAccentColor: vi.fn(), applyThemePreference: vi.fn() }));
vi.mock('@/i18n', () => ({ getLocale: vi.fn() }));
vi.mock('./domain', () => ({ getDomain: vi.fn() }));
vi.mock('./is', () => ({ isOfficial: vi.fn(), isSubOfficial: vi.fn(), isWechatBrowser: vi.fn() }));

import { initializeFavicon } from './initializer';

describe('initializeFavicon', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    mocks.site = {};
  });

  it('updates browser and Apple icons for a tenant', async () => {
    mocks.site = { favicon: 'https://cdn.example.com/tenant.png' };

    await initializeFavicon();

    expect(document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href).toBe(
      'https://cdn.example.com/tenant.png'
    );
    expect(document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.href).toBe(
      'https://cdn.example.com/tenant.png'
    );
  });

  it('uses the canonical CDN fallback when no tenant icon exists', async () => {
    await initializeFavicon();

    expect(document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href).toBe(
      'https://cdn.acedata.cloud/favicon.ico'
    );
    expect(document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.getAttribute('href')).toBe(
      'https://cdn.acedata.cloud/apple-touch-icon.png'
    );
  });
});
