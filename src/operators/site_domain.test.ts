import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }));

vi.mock('./common', () => ({ httpClient: http }));

import { siteDomainOperator } from './site_domain';

describe('siteDomainOperator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses trailing slashes for DRF detail endpoints', async () => {
    http.get.mockResolvedValue({ data: { id: 'domain-1' } });
    http.delete.mockResolvedValue({ data: undefined });

    await siteDomainOperator.get('domain-1');
    await siteDomainOperator.delete('domain-1');

    expect(http.get).toHaveBeenCalledWith('/site-domains/domain-1/');
    expect(http.delete).toHaveBeenCalledWith('/site-domains/domain-1/');
  });
});
