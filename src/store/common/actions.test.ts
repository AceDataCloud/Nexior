import { beforeEach, describe, expect, it, vi } from 'vitest';

const siteOperatorMock = vi.hoisted(() => ({
  getAll: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteOperator: siteOperatorMock
}));

import { getSite } from './actions';

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
