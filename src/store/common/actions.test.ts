import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getAll: vi.fn(),
  logout: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteOperator: { getAll: mocks.getAll },
  authOperator: { logout: mocks.logout }
}));

vi.mock('@/utils/surface', () => ({
  isNative: () => true,
  isDesktop: () => false
}));

vi.mock('@/utils/loginMethod', () => ({
  isIframeLoginEnabled: () => false
}));

vi.mock('@/store/lazy', () => ({
  getRegisteredLazyModules: () => ['nanobanana', 'chat']
}));

import { getSite, logout, resetAll } from './actions';

describe('store/common getSite', () => {
  const commit = vi.fn();
  const state = { site: { origin: 'https://example.com' } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the site committed to the store', async () => {
    const site = { id: 'site-1', origin: 'https://example.com' };
    mocks.getAll.mockResolvedValue({ data: { items: [site] } });

    await expect(getSite({ state, commit } as never)).resolves.toBe(site);
    expect(commit).toHaveBeenCalledWith('setSite', site);
  });

  it('returns undefined without replacing state when refresh fails', async () => {
    mocks.getAll.mockRejectedValue(new Error('network failure'));

    await expect(getSite({ state, commit } as never)).resolves.toBeUndefined();
    expect(commit).not.toHaveBeenCalled();
  });
});

describe('store/common logout', () => {
  const state = { token: { refresh: 'refresh-token' } };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('window', { location: { pathname: '/account', search: '' } });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('revokes the refresh token before clearing local state', async () => {
    mocks.logout.mockResolvedValue(undefined);
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const commit = vi.fn();

    await logout({ state, dispatch, commit } as any);

    expect(mocks.logout).toHaveBeenCalledWith('refresh-token');
    expect(dispatch).toHaveBeenCalledWith('resetAll');
  });

  it('clears local state when token revocation fails', async () => {
    mocks.logout.mockRejectedValue(new Error('network failure'));
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const commit = vi.fn();

    await logout({ state, dispatch, commit } as any);

    expect(dispatch).toHaveBeenCalledWith('resetAll');
  });
});

describe('store/common resetAll', () => {
  it('clears account-owned state from the root and registered app modules', async () => {
    const commit = vi.fn();
    const dispatch = vi.fn().mockResolvedValue(undefined);

    await resetAll({ commit, dispatch } as any);

    expect(commit).toHaveBeenCalledWith('resetToken');
    expect(commit).toHaveBeenCalledWith('resetUser');
    expect(commit).toHaveBeenCalledWith('setApplications', undefined);
    expect(dispatch).toHaveBeenCalledWith('nanobanana/resetAll');
    expect(dispatch).toHaveBeenCalledWith('chat/resetAll');
  });
});
