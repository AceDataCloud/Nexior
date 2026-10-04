import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Status } from '@/models';

const store = vi.hoisted(() => ({
  state: { token: { access: undefined as string | undefined }, status: { getSite: 'Success' } },
  dispatch: vi.fn()
}));
vi.mock('@/store', () => ({ default: store }));
vi.mock('typescript-cookie', () => ({ getCookie: vi.fn(), setCookie: vi.fn() }));
vi.mock('./theme', () => ({ applyAccentColor: vi.fn(), applyThemePreference: vi.fn() }));
vi.mock('@/i18n', () => ({ getLocale: vi.fn() }));
vi.mock('./domain', () => ({ getDomain: vi.fn() }));
vi.mock('./is', () => ({ isWechatBrowser: vi.fn() }));

import { initializeSite } from './initializer';

describe('site initialization', () => {
  beforeEach(() => {
    store.dispatch.mockReset();
    store.state.status.getSite = Status.Success;
    store.state.token.access = 'test-token';
  });

  it.each([undefined, 'test-token'])('never logs in or runs setup after a failed lookup', async (token) => {
    store.state.token.access = token;
    store.state.status.getSite = Status.Error;
    await initializeSite();
    expect(store.dispatch).toHaveBeenCalledExactlyOnceWith('getSite');
  });

  it('starts login when a successful lookup finds no site for an anonymous visitor', async () => {
    store.state.token.access = undefined;
    await initializeSite();
    expect(store.dispatch.mock.calls).toEqual([['getSite'], ['login']]);
  });

  it.each([{ admins: ['owner'] }, { admins: [] }])(
    'keeps anonymous visitors on an existing site',
    async ({ admins }) => {
      store.state.token.access = undefined;
      store.dispatch.mockResolvedValueOnce({ id: 'site-1', origin: 'tenant.example.com', admins });
      await initializeSite();
      expect(store.dispatch).toHaveBeenCalledExactlyOnceWith('getSite');
    }
  );

  it.each([undefined, { origin: 'tenant.example.com', admins: [] }])(
    'keeps authenticated setup after a successful lookup of an unconfigured site',
    async (site) => {
      store.dispatch.mockResolvedValueOnce(site);
      await initializeSite();
      expect(store.dispatch.mock.calls).toEqual([['getSite'], ['initializeSite']]);
    }
  );

  it('leaves an existing configured site alone', async () => {
    store.dispatch.mockResolvedValueOnce({ id: 'site-1', origin: 'tenant.example.com', admins: ['owner'] });
    await initializeSite();
    expect(store.dispatch).toHaveBeenCalledExactlyOnceWith('getSite');
  });
});
