// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getSiteOrigin } from './site';

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
