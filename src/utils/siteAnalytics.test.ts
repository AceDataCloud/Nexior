// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ISite } from '@/models';

const surface = vi.hoisted(() => ({ web: true }));
vi.mock('@/utils/surface', () => ({ isWeb: () => surface.web }));

import { initializeSiteAnalytics, shouldLoadSiteAnalytics, trackSitePageView } from './siteAnalytics';

const site: ISite = {
  origin: 'tenant.studio.acedata.cloud',
  active_page_hosts: ['studio.tenant.example'],
  analytics: {
    ga4: { enabled: true, measurement_id: 'G-ABC123' },
    baidu: { enabled: true, site_id: 'a'.repeat(32) },
    clarity: { enabled: true, project_id: 'clarity123' },
    umami: {
      enabled: true,
      website_id: '12345678-1234-5678-9abc-123456789abc',
      server_url: 'https://cloud.umami.is'
    }
  }
};

beforeEach(() => {
  surface.web = true;
});

afterEach(() => {
  document.querySelectorAll('[data-site-analytics]').forEach((node) => node.remove());
  vi.restoreAllMocks();
});

describe('shouldLoadSiteAnalytics', () => {
  it('accepts the canonical tenant Site origin', () => {
    expect(shouldLoadSiteAnalytics(site, 'tenant.studio.acedata.cloud')).toBe(true);
  });

  it('accepts a verified active page host', () => {
    expect(shouldLoadSiteAnalytics(site, 'studio.tenant.example')).toBe(true);
  });

  it.each(['studio.acedata.cloud', 'localhost', '127.0.0.1', 'unverified.example'])('rejects %s', (hostname) => {
    expect(shouldLoadSiteAnalytics(site, hostname)).toBe(false);
  });

  it('rejects native and desktop surfaces even with the Studio Site config', () => {
    surface.web = false;
    expect(shouldLoadSiteAnalytics(site, 'tenant.studio.acedata.cloud')).toBe(false);
  });

  it('requires an enabled provider', () => {
    expect(
      shouldLoadSiteAnalytics(
        { ...site, analytics: { ga4: { enabled: false, measurement_id: 'G-ABC123' } } },
        'tenant.studio.acedata.cloud'
      )
    ).toBe(false);
  });
});

describe('initializeSiteAnalytics', () => {
  it('loads every provider from a reviewed URL once', () => {
    initializeSiteAnalytics(site, 'tenant.studio.acedata.cloud');
    initializeSiteAnalytics(site);

    const scripts = Array.from(document.querySelectorAll<HTMLScriptElement>('[data-site-analytics]'));
    expect(scripts).toHaveLength(4);
    expect(scripts.map((script) => script.src)).toEqual(
      expect.arrayContaining([
        'https://www.googletagmanager.com/gtag/js?id=G-ABC123',
        `https://hm.baidu.com/hm.js?${'a'.repeat(32)}`,
        'https://www.clarity.ms/tag/clarity123',
        'https://cloud.umami.is/script.js'
      ])
    );
    expect(document.querySelector<HTMLScriptElement>('#site-analytics-umami')?.dataset.websiteId).toBe(
      '12345678-1234-5678-9abc-123456789abc'
    );
  });

  it('does not inject scripts off-web', () => {
    surface.web = false;
    initializeSiteAnalytics(site, 'tenant.studio.acedata.cloud');
    expect(document.querySelector('[data-site-analytics]')).toBeNull();
  });
});

describe('trackSitePageView', () => {
  it('keeps SPA navigation isolated from provider failures', () => {
    initializeSiteAnalytics(site, 'tenant.studio.acedata.cloud');
    expect(() => trackSitePageView('/chatgpt')).not.toThrow();
  });
});
