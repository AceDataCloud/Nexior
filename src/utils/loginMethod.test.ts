import { beforeEach, describe, expect, it, vi } from 'vitest';

const storeMock = vi.hoisted(() => ({
  getters: {} as { site?: unknown }
}));

vi.mock('@/store', () => ({ default: storeMock }));

import { getSiteLoginMode, isIframeLoginEnabled } from './loginMethod';

describe('utils/loginMethod', () => {
  beforeEach(() => {
    storeMock.getters = {};
  });

  describe('when the site is resolved', () => {
    it('honours login_mode=iframe', () => {
      storeMock.getters = { site: { id: 's1', auth: { login_mode: 'iframe' } } };
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

  describe('when the site has not resolved yet', () => {
    it('defaults to redirect when the store is empty', () => {
      storeMock.getters = {};
      expect(getSiteLoginMode()).toBe('redirect');
      expect(isIframeLoginEnabled()).toBe(false);
    });

    it('defaults to redirect when the site lookup returned nothing', () => {
      storeMock.getters = { site: {} };
      expect(getSiteLoginMode()).toBe('redirect');
      expect(isIframeLoginEnabled()).toBe(false);
    });
  });
});
