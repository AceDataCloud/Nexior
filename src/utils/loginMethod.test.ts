import { beforeEach, describe, expect, it, vi } from 'vitest';

const storeMock = vi.hoisted(() => ({
  getters: {} as { site?: unknown }
}));

vi.mock('@/store', () => ({ default: storeMock }));

import { getSiteLoginMode, isIframeLoginEnabled, isSiteLoaded } from './loginMethod';

describe('utils/loginMethod', () => {
  beforeEach(() => {
    storeMock.getters = {};
  });

  describe('when the site is resolved', () => {
    it('honours login_mode=iframe', () => {
      storeMock.getters = { site: { id: 's1', auth: { login_mode: 'iframe' } } };
      expect(isSiteLoaded()).toBe(true);
      expect(getSiteLoginMode()).toBe('iframe');
      expect(isIframeLoginEnabled()).toBe(true);
    });

    it('honours login_mode=redirect', () => {
      storeMock.getters = { site: { id: 's1', auth: { login_mode: 'redirect' } } };
      expect(isIframeLoginEnabled()).toBe(false);
    });

    it('defaults an unset login_mode to redirect', () => {
      storeMock.getters = { site: { id: 's1', auth: {} } };
      expect(isIframeLoginEnabled()).toBe(false);
    });
  });

  // Regression: `site` is not persisted, so a slow or failed /api/v1/sites/
  // call leaves the store empty. Falling back to `redirect` there threw users
  // of an iframe-mode white-label site off the operator's domain onto
  // auth.acedata.cloud. Prefer the reversible branch while the answer is
  // still unknown.
  describe('when the site has not resolved yet', () => {
    it('does not fall back to redirect when the store is empty', () => {
      storeMock.getters = {};
      expect(isSiteLoaded()).toBe(false);
      expect(isIframeLoginEnabled()).toBe(true);
    });

    it('does not fall back to redirect when the site lookup returned nothing', () => {
      storeMock.getters = { site: {} };
      expect(isSiteLoaded()).toBe(false);
      expect(isIframeLoginEnabled()).toBe(true);
    });
  });
});
