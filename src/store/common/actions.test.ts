import { beforeEach, describe, expect, it, vi } from 'vitest';

const siteOperatorMock = vi.hoisted(() => ({
  getAll: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteOperator: siteOperatorMock
}));

vi.mock('@/store/lazy', () => ({
  getRegisteredLazyModules: () => ['nanobanana', 'chat']
}));

import { getSite, resetAll } from './actions';

describe('store/common getSite', () => {
  const commit = vi.fn();
  const state = { site: { origin: 'https://example.com' } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the site committed to the store', async () => {
    const site = { id: 'site-1', origin: 'https://example.com' };
    siteOperatorMock.getAll.mockResolvedValue({ data: { items: [site] } });

    await expect(getSite({ state, commit } as never)).resolves.toBe(site);
    expect(commit).toHaveBeenCalledWith('setSite', site);
  });

  it('returns undefined without replacing state when refresh fails', async () => {
    siteOperatorMock.getAll.mockRejectedValue(new Error('network failure'));

    await expect(getSite({ state, commit } as never)).resolves.toBeUndefined();
    expect(commit).not.toHaveBeenCalled();
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
