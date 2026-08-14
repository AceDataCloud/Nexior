import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock('./common', () => ({ httpClient: http }));

import { siteOperator } from './site';

describe('siteOperator management contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the public and authenticated site endpoints', async () => {
    http.get.mockResolvedValue({ data: { origin: 'tenant.example.com' } });
    await siteOperator.resolvePublic('tenant.example.com');
    await siteOperator.getManaged({ origin__endswith: '.studio.acedata.cloud' });
    await siteOperator.getManagedCurrent('tenant.example.com');

    expect(http.get).toHaveBeenNthCalledWith(1, '/sites/resolve', { params: { origin: 'tenant.example.com' } });
    expect(http.get).toHaveBeenNthCalledWith(2, '/sites/managed', {
      params: { origin__endswith: '.studio.acedata.cloud' }
    });
    expect(http.get).toHaveBeenNthCalledWith(3, '/sites/managed/current', {
      params: { origin: 'tenant.example.com' }
    });
  });

  it('does not downgrade a forbidden management response', async () => {
    http.get.mockRejectedValue({ response: { status: 403 } });
    await expect(siteOperator.getManagedCurrent('tenant.example.com')).rejects.toMatchObject({
      response: { status: 403 }
    });
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it('falls back only when the new endpoint is unavailable', async () => {
    http.get.mockRejectedValueOnce({ response: { status: 404 } }).mockResolvedValueOnce({
      data: { count: 1, items: [{ origin: 'tenant.example.com' }] }
    });
    const response = await siteOperator.resolvePublic('tenant.example.com');
    expect(response.data).toEqual({ origin: 'tenant.example.com' });
    expect(http.get).toHaveBeenLastCalledWith('/sites/', { params: { origin: 'tenant.example.com' } });
  });
});
