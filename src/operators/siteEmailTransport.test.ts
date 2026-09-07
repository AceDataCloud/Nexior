import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('./common', () => ({ httpClient: http }));
vi.mock('@/utils', () => ({ getBaseUrlAuth: () => 'https://auth.example.com' }));

import { siteEmailTransportOperator } from './siteEmailTransport';

describe('siteEmailTransportOperator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('tests only the saved Site auth SMTP configuration', async () => {
    await siteEmailTransportOperator.test('site-1');

    expect(http.post).toHaveBeenCalledWith('/site-email-transports/site-1/test/', undefined, {
      baseURL: 'https://auth.example.com/api/v1'
    });
  });
});
