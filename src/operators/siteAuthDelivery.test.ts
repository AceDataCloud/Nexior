import { beforeEach, describe, expect, it, vi } from 'vitest';

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), post: vi.fn(), delete: vi.fn() }));
vi.mock('./common', () => ({ httpClient: http }));
vi.mock('@/utils', () => ({ getBaseUrlAuth: () => 'https://auth.example.com' }));

import { siteAuthDeliveryOperator } from './siteAuthDelivery';

describe('siteAuthDeliveryOperator', () => {
  beforeEach(() => vi.clearAllMocks());

  it('tests only saved configurations through AuthBackend', async () => {
    await siteAuthDeliveryOperator.testEmail('site-1');
    await siteAuthDeliveryOperator.testPhone('site-1', { receiver: '138', region: '86', locale: 'zh-CN' });
    expect(http.post).toHaveBeenNthCalledWith(1, '/site-auth-deliveries/site-1/email/test/', undefined, {
      baseURL: 'https://auth.example.com/api/v1'
    });
    expect(http.post).toHaveBeenNthCalledWith(
      2,
      '/site-auth-deliveries/site-1/phone/test/',
      { receiver: '138', region: '86', locale: 'zh-CN' },
      { baseURL: 'https://auth.example.com/api/v1' }
    );
  });
});
