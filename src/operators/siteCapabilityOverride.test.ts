import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }));

vi.mock('./common', () => ({ httpClient: http }));

import { siteCapabilityOverrideOperator } from './siteCapabilityOverride';

describe('siteCapabilityOverrideOperator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the site capability override endpoints', async () => {
    http.get.mockResolvedValue({ data: { count: 0, items: [] } });
    http.post.mockResolvedValue({ data: { id: 'override-1' } });
    http.patch.mockResolvedValue({ data: { id: 'override-1' } });
    http.delete.mockResolvedValue({ data: undefined });

    await siteCapabilityOverrideOperator.getAll({ site: 'site-1' });
    await siteCapabilityOverrideOperator.create({ site: 'site-1', capability: 'chatgpt', display_name: 'Assistant' });
    await siteCapabilityOverrideOperator.update('override-1', { icon_url: 'https://cdn.example.com/icon.png' });
    await siteCapabilityOverrideOperator.delete('override-1');

    expect(http.get).toHaveBeenCalledWith('/site-capability-overrides/', { params: { site: 'site-1' } });
    expect(http.post).toHaveBeenCalledWith('/site-capability-overrides/', {
      site: 'site-1',
      capability: 'chatgpt',
      display_name: 'Assistant'
    });
    expect(http.patch).toHaveBeenCalledWith('/site-capability-overrides/override-1/', {
      icon_url: 'https://cdn.example.com/icon.png'
    });
    expect(http.delete).toHaveBeenCalledWith('/site-capability-overrides/override-1/');
  });
});
