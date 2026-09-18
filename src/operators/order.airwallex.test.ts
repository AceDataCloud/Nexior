import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authenticatedPost: vi.fn(),
  anonymousGet: vi.fn(),
  anonymousPost: vi.fn(),
  overrides: '',
  airwallexEnabled: false
}));
vi.mock('./common', () => ({
  httpClient: { post: mocks.authenticatedPost },
  anonymousHttpClient: { get: mocks.anonymousGet, post: mocks.anonymousPost }
}));
vi.mock('@/utils/featureFlag', () => ({
  getStickyFeatureOverrides: () => mocks.overrides,
  isFeatureEnabled: () => mocks.airwallexEnabled
}));

import { orderOperator } from './order';

describe('order payment feature overrides', () => {
  beforeEach(() => {
    mocks.authenticatedPost.mockReset().mockResolvedValue({ data: {} });
    mocks.anonymousGet.mockReset().mockResolvedValue({ data: {} });
    mocks.anonymousPost.mockReset().mockResolvedValue({ data: {} });
    mocks.overrides = '';
    mocks.airwallexEnabled = false;
  });

  it('forwards sticky overrides to authenticated pay requests', async () => {
    mocks.overrides = 'airwallex';
    await orderOperator.pay('order-id', { pay_way: 'Airwallex' });
    expect(mocks.authenticatedPost).toHaveBeenCalledWith(
      '/orders/order-id/pay/',
      { pay_way: 'Airwallex' },
      { headers: { 'x-feature-overrides': 'airwallex' } }
    );
  });

  it('expands the all UI override into the Airwallex backend override', async () => {
    mocks.overrides = 'all';
    mocks.airwallexEnabled = true;
    await orderOperator.pay('order-id', { pay_way: 'Airwallex' });
    expect(mocks.authenticatedPost.mock.calls[0][2]).toEqual({
      headers: { 'x-feature-overrides': 'airwallex' }
    });
  });

  it('preserves an explicit Airwallex force-off', async () => {
    mocks.overrides = 'all,-airwallex';
    await orderOperator.pay('order-id', { pay_way: 'Card' });
    expect(mocks.authenticatedPost.mock.calls[0][2]).toEqual({
      headers: { 'x-feature-overrides': '-airwallex' }
    });
  });

  it('uses the anonymous client to poll public payment links', async () => {
    await orderOperator.getPublic('order-id');
    expect(mocks.anonymousGet).toHaveBeenCalledWith('/orders/order-id');
    expect(mocks.authenticatedPost).not.toHaveBeenCalled();
  });

  it('uses the anonymous client for public payment links', async () => {
    mocks.airwallexEnabled = true;
    await orderOperator.payPublic('order-id', { pay_way: 'Airwallex' });
    expect(mocks.anonymousPost).toHaveBeenCalledWith(
      '/orders/order-id/pay/',
      { pay_way: 'Airwallex' },
      { headers: { 'x-feature-overrides': 'airwallex' } }
    );
    expect(mocks.authenticatedPost).not.toHaveBeenCalled();
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
