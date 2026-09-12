import { beforeEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();
vi.mock('./common', () => ({
  httpClient: { get, post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
  anonymousHttpClient: { get }
}));

const { siteHomeSectionOperator } = await import('./siteHomeSection');

describe('siteHomeSectionOperator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses separate management and public endpoints', async () => {
    get.mockResolvedValue({ data: [] });
    await siteHomeSectionOperator.getAll({ site: 'site-1', ordering: 'sort_order' });
    expect(get).toHaveBeenCalledWith('/site-home-sections/', {
      params: { site: 'site-1', ordering: 'sort_order' }
    });
    await siteHomeSectionOperator.getPublic('tenant.example', 'zh-CN');
    expect(get).toHaveBeenLastCalledWith('/site-home-sections/public/', {
      params: { origin: 'tenant.example', lang: 'zh-CN' }
    });
  });
});
