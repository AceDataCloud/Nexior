import { beforeEach, describe, expect, it, vi } from 'vitest';

const siteOperatorMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  initialize: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteOperator: siteOperatorMock
}));

vi.mock('@/store/lazy', () => ({
  getRegisteredLazyModules: () => ['nanobanana', 'chat']
}));

import { getSite, initializeSite, resetAll } from './actions';

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

  it('propagates startup failures and passes its bounded timeout to the request', async () => {
    const error = new Error('network failure');
    siteOperatorMock.getAll.mockRejectedValue(error);
    await expect(getSite({ state, commit } as never, { timeout: 2000, throwOnError: true })).rejects.toBe(error);
    expect(siteOperatorMock.getAll.mock.calls[0][1]).toEqual({ timeout: 2000 });
    expect(commit).not.toHaveBeenCalled();
  });

  it('propagates setup failures to the startup error boundary', async () => {
    const error = new Error('network failure');
    siteOperatorMock.initialize.mockRejectedValue(error);
    await expect(initializeSite({ state, commit } as never, { timeout: 5000, throwOnError: true })).rejects.toBe(error);
    expect(commit).not.toHaveBeenCalled();
  });

  it.each([{}, { items: [{ id: 'site-1' }] }])('does not treat a malformed success as an absent site', async (data) => {
    siteOperatorMock.getAll.mockResolvedValue({ data });
    await expect(getSite({ state, commit } as never, { throwOnError: true })).rejects.toThrow(
      'Invalid site configuration response'
    );
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
