// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBaseUrlStudio } from './baseUrl';

describe('getBaseUrlStudio', () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(['desktop', 'ios', 'android'])('uses canonical Studio on %s', (surface) => {
    vi.stubEnv('VITE_SURFACE', surface);
    expect(getBaseUrlStudio()).toBe('https://studio.acedata.cloud');
  });

  it('keeps the current origin on web for white-label sites', () => {
    vi.stubEnv('VITE_SURFACE', 'web');
    expect(getBaseUrlStudio()).toBe(window.location.origin);
  });

  it('accepts the renamed Studio build override', () => {
    vi.stubEnv('VITE_SURFACE', 'desktop');
    vi.stubEnv('VITE_BASE_URL_STUDIO', 'https://preview.studio.example');
    expect(getBaseUrlStudio()).toBe('https://preview.studio.example');
  });
});
