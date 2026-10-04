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

import { Status } from '@/models';
import { getSite, initializeSite, resetAll } from './actions';

describe('store/common getSite', () => {
  const commit = vi.fn();
  const state = { site: { origin: 'https://example.com' }, status: { getSite: undefined as Status | undefined } };

  beforeEach(() => {
    vi.clearAllMocks();
    state.status.getSite = undefined;
  });

  it('returns the site committed to the store', async () => {
    const site = { id: 'site-1', origin: 'https://example.com' };
    siteOperatorMock.getAll.mockResolvedValue({ data: { items: [site] } });

    await expect(getSite({ state, commit } as never)).resolves.toBe(site);
    expect(commit).toHaveBeenCalledWith('setSite', site);
    expect(state.status.getSite).toBe(Status.Success);
  });

  it('returns undefined without replacing state when refresh fails', async () => {
    siteOperatorMock.getAll.mockRejectedValue(new Error('network failure'));

    await expect(getSite({ state, commit } as never)).resolves.toBeUndefined();
    expect(commit).not.toHaveBeenCalled();
    expect(state.status.getSite).toBe(Status.Error);
  });

  it('distinguishes a successful empty lookup from a failed request', async () => {
    siteOperatorMock.getAll.mockResolvedValue({ data: { items: [] } });
    await expect(getSite({ state, commit } as never)).resolves.toBeUndefined();
    expect(state.status.getSite).toBe(Status.Success);
  });

  it('does not treat a malformed response as an empty site list', async () => {
    siteOperatorMock.getAll.mockResolvedValue({ data: '<html>error</html>' });
    await expect(getSite({ state, commit } as never)).resolves.toBeUndefined();
    expect(state.status.getSite).toBe(Status.Error);
    expect(commit).not.toHaveBeenCalled();
  });

  it('exposes setup failure and clears the error when a later lookup succeeds', async () => {
    siteOperatorMock.initialize.mockRejectedValue(new Error('connection refused'));
    await initializeSite({ state, commit } as never);
    expect(state.status.getSite).toBe(Status.Error);
    siteOperatorMock.getAll.mockResolvedValue({ data: { items: [{ id: 'site-1' }] } });
    await getSite({ state, commit } as never);
    expect(state.status.getSite).toBe(Status.Success);
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
