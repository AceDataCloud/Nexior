// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSiteOrigin, getSiteMarkupRatio, applyMarkup, isBrandingHidden, getBrandSupportUrl } from './site';

/**
 * getSiteOrigin must treat desktop (Electron, app://bundle authority "bundle")
 * the same as native (Capacitor, localhost) — both have a useless
 * window.location.host and must fall back to the canonical first-party host so
 * the bundle resolves the real Site row instead of looking up "bundle".
 */
describe('getSiteOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('falls back to studio host on desktop', () => {
    vi.stubEnv('VITE_SURFACE', 'desktop');
    expect(getSiteOrigin()).toBe('studio.acedata.cloud');
  });

  it('falls back to studio host on native', () => {
    vi.stubEnv('VITE_SURFACE', 'ios');
    expect(getSiteOrigin()).toBe('studio.acedata.cloud');
  });

  it('trusts an explicit site origin regardless of surface', () => {
    vi.stubEnv('VITE_SURFACE', 'desktop');
    expect(getSiteOrigin({ origin: 'tenant.example.com' } as never)).toBe('tenant.example.com');
  });
});

describe('getSiteMarkupRatio', () => {
  it('returns 0 when site / metadata / pricing is missing', () => {
    expect(getSiteMarkupRatio()).toBe(0);
    expect(getSiteMarkupRatio(null)).toBe(0);
    expect(getSiteMarkupRatio({} as never)).toBe(0);
    expect(getSiteMarkupRatio({ metadata: {} } as never)).toBe(0);
    expect(getSiteMarkupRatio({ metadata: { pricing: {} } } as never)).toBe(0);
  });

  it('reads a valid ratio', () => {
    expect(getSiteMarkupRatio({ metadata: { pricing: { markup_ratio: 0.3 } } } as never)).toBe(0.3);
  });

  it('clamps above the ceiling and floors below zero / garbage to 0', () => {
    expect(getSiteMarkupRatio({ metadata: { pricing: { markup_ratio: 9 } } } as never)).toBe(5);
    expect(getSiteMarkupRatio({ metadata: { pricing: { markup_ratio: -1 } } } as never)).toBe(0);
    expect(getSiteMarkupRatio({ metadata: { pricing: { markup_ratio: 'x' } } } as never)).toBe(0);
    expect(getSiteMarkupRatio({ metadata: { pricing: { markup_ratio: NaN } } } as never)).toBe(0);
  });

  it('ignores a non-"all" applies_to (only v1 "all" is honored)', () => {
    expect(getSiteMarkupRatio({ metadata: { pricing: { markup_ratio: 0.3, applies_to: 'foo' } } } as never)).toBe(0);
    expect(getSiteMarkupRatio({ metadata: { pricing: { markup_ratio: 0.3, applies_to: 'all' } } } as never)).toBe(0.3);
  });
});

describe('applyMarkup', () => {
  it('multiplies by (1 + ratio)', () => {
    expect(applyMarkup(10, 0.3)).toBeCloseTo(13);
    expect(applyMarkup(10, 0)).toBe(10);
    expect(applyMarkup(0, 0.3)).toBe(0);
  });

  it('treats missing / negative / non-finite inputs as no markup', () => {
    expect(applyMarkup(10)).toBe(10);
    expect(applyMarkup(10, -1)).toBe(10);
    expect(applyMarkup(undefined, 0.3)).toBe(0);
    expect(applyMarkup(NaN, 0.3)).toBe(0);
  });
});

describe('isBrandingHidden', () => {
  it('returns false when site / branding / flag is unset (default = show ours)', () => {
    expect(isBrandingHidden(null, 'powered_by')).toBe(false);
    expect(isBrandingHidden(undefined, 'api_code')).toBe(false);
    expect(isBrandingHidden({} as never, 'powered_by')).toBe(false);
    expect(isBrandingHidden({ branding: {} } as never, 'api_code')).toBe(false);
  });

  it('hides only on an explicit boolean true (not truthy coercions)', () => {
    expect(isBrandingHidden({ branding: { hide_powered_by: true } } as never, 'powered_by')).toBe(true);
    expect(isBrandingHidden({ branding: { hide_api_code: true } } as never, 'api_code')).toBe(true);
    expect(isBrandingHidden({ branding: { hide_powered_by: false } } as never, 'powered_by')).toBe(false);
    expect(isBrandingHidden({ branding: { hide_powered_by: 1 } } as never, 'powered_by')).toBe(false);
  });

  it('keys are independent', () => {
    const site = { branding: { hide_api_code: true } } as never;
    expect(isBrandingHidden(site, 'api_code')).toBe(true);
    expect(isBrandingHidden(site, 'powered_by')).toBe(false);
  });
});

describe('getBrandSupportUrl', () => {
  it('prefers branding.links.support, then metadata.support_url, else empty', () => {
    expect(
      getBrandSupportUrl({
        branding: { links: { support: 'https://a.com' } },
        metadata: { support_url: 'https://b.com' }
      } as never)
    ).toBe('https://a.com');
    expect(getBrandSupportUrl({ metadata: { support_url: 'https://b.com' } } as never)).toBe('https://b.com');
    expect(getBrandSupportUrl({} as never)).toBe('');
    expect(getBrandSupportUrl(null)).toBe('');
  });
});
