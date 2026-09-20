import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticatedPost: vi.fn(),
  anonymousGet: vi.fn(),
  anonymousPost: vi.fn()
}));
vi.mock('./common', () => ({
  httpClient: { post: mocks.authenticatedPost },
  anonymousHttpClient: { get: mocks.anonymousGet, post: mocks.anonymousPost }
}));

import { orderOperator } from './order';

describe('order Airwallex requests', () => {
  beforeEach(() => {
    mocks.authenticatedPost.mockReset().mockResolvedValue({ data: {} });
    mocks.anonymousGet.mockReset().mockResolvedValue({ data: {} });
    mocks.anonymousPost.mockReset().mockResolvedValue({ data: {} });
  });

  it('does not add custom headers to authenticated payment requests', async () => {
    await orderOperator.pay('order-id', { pay_way: 'Airwallex' });
    expect(mocks.authenticatedPost).toHaveBeenCalledWith('/orders/order-id/pay/', { pay_way: 'Airwallex' });
  });

  it('passes the PaymentIntent contract through the request body', async () => {
    const payload = { pay_way: 'Airwallex', payment_contract: 'airwallex_payment_intent' as const };
    await orderOperator.pay('order-id', payload);
    expect(mocks.authenticatedPost).toHaveBeenCalledWith('/orders/order-id/pay/', payload);
  });

  it('uses the anonymous client to load public payment links', async () => {
    await orderOperator.getPublic('order-id');
    expect(mocks.anonymousGet).toHaveBeenCalledWith('/orders/order-id');
  });

  it('does not add custom headers to public payment requests', async () => {
    await orderOperator.payPublic('order-id', { pay_way: 'Airwallex' });
    expect(mocks.anonymousPost).toHaveBeenCalledWith('/orders/order-id/pay/', { pay_way: 'Airwallex' });
  });

  it('preserves the X402 signature flow', async () => {
    await orderOperator.payX402WithHeader('order-id', { pay_way: 'X402' }, 'signed');
    expect(mocks.authenticatedPost).toHaveBeenCalledWith(
      '/orders/order-id/pay/',
      { pay_way: 'X402' },
      { headers: { 'PAYMENT-SIGNATURE': 'signed' } }
    );
  });
});
