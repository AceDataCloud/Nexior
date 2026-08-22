import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from './common';
import { siteBannerOperator } from './siteBanner';

vi.mock('./common', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

describe('siteBannerOperator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('scopes management and public reads', async () => {
    vi.mocked(httpClient.get).mockResolvedValue({ data: [] });
    await siteBannerOperator.getAll({ site: 'site-1', ordering: 'sort_order,created_at' });
    await siteBannerOperator.getPublic('tenant.studio.acedata.cloud');
    expect(httpClient.get).toHaveBeenNthCalledWith(1, '/site-banners/', {
      params: { site: 'site-1', ordering: 'sort_order,created_at' }
    });
    expect(httpClient.get).toHaveBeenNthCalledWith(2, '/site-banners/public/', {
      params: { origin: 'tenant.studio.acedata.cloud' }
    });
  });

  it('uses the authenticated CRUD routes', async () => {
    vi.mocked(httpClient.post).mockResolvedValue({ data: {} });
    vi.mocked(httpClient.patch).mockResolvedValue({ data: {} });
    vi.mocked(httpClient.delete).mockResolvedValue({ data: undefined });
    await siteBannerOperator.create({ site: 'site-1', visible: true });
    await siteBannerOperator.update('banner-1', { visible: false });
    await siteBannerOperator.delete('banner-1');
    expect(httpClient.post).toHaveBeenCalledWith('/site-banners/', { site: 'site-1', visible: true });
    expect(httpClient.patch).toHaveBeenCalledWith('/site-banners/banner-1/', { visible: false });
    expect(httpClient.delete).toHaveBeenCalledWith('/site-banners/banner-1/');
  });
});
