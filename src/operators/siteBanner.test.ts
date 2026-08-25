import { beforeEach, describe, expect, it, vi } from 'vitest';

const clients = vi.hoisted(() => ({
  required: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  anonymous: { get: vi.fn() }
}));

vi.mock('./common', () => ({
  httpClient: clients.required,
  anonymousHttpClient: clients.anonymous
}));

import { siteBannerOperator } from './siteBanner';

describe('siteBannerOperator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('scopes management and public reads to their auth clients', async () => {
    clients.required.get.mockResolvedValue({ data: [] });
    clients.anonymous.get.mockResolvedValue({ data: [] });
    await siteBannerOperator.getAll({ site: 'site-1', ordering: 'sort_order,created_at' });
    await siteBannerOperator.getPublic('tenant.studio.acedata.cloud');
    expect(clients.required.get).toHaveBeenCalledWith('/site-banners/', {
      params: { site: 'site-1', ordering: 'sort_order,created_at' }
    });
    expect(clients.anonymous.get).toHaveBeenCalledWith('/site-banners/public/', {
      params: { origin: 'tenant.studio.acedata.cloud' }
    });
  });

  it('uses the authenticated CRUD routes', async () => {
    clients.required.post.mockResolvedValue({ data: {} });
    clients.required.patch.mockResolvedValue({ data: {} });
    clients.required.delete.mockResolvedValue({ data: undefined });
    await siteBannerOperator.create({ site: 'site-1', visible: true });
    await siteBannerOperator.update('banner-1', { visible: false });
    await siteBannerOperator.delete('banner-1');
    expect(clients.required.post).toHaveBeenCalledWith('/site-banners/', { site: 'site-1', visible: true });
    expect(clients.required.patch).toHaveBeenCalledWith('/site-banners/banner-1/', { visible: false });
    expect(clients.required.delete).toHaveBeenCalledWith('/site-banners/banner-1/');
  });
});
