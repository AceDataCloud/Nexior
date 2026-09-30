// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';

const { ios, refresh, pay } = vi.hoisted(() => ({ ios: vi.fn(), refresh: vi.fn(), pay: vi.fn() }));
vi.mock('@/operators/order', () => ({ orderOperator: { refresh, pay } }));
vi.mock('@/utils', () => ({
  isIOS: ios,
  isAndroid: () => false,
  supportsAirwallexPaymentIntent: () => false,
  getPaymentSurface: () => 'ios',
  getPriceString: () => ''
}));
vi.mock('@/plugins/telemetry', () => ({ track: vi.fn() }));
vi.mock('@/components/order/WechatPay.vue', () => ({ default: {} }));
vi.mock('@/components/order/StripePay.vue', () => ({ default: {} }));
vi.mock('@/components/order/AliPay.vue', () => ({ default: {} }));
vi.mock('@/components/order/X402Pay.vue', () => ({ default: {} }));
vi.mock('@/components/order/PaypalPay.vue', () => ({ default: {} }));
vi.mock('@/components/order/ApplePay.vue', () => ({ default: {} }));
vi.mock('@/components/common/CopyToClipboard.vue', () => ({ default: {} }));
vi.mock('@/utils/airwallexCheckout', () => ({ redirectToAirwallexCheckout: vi.fn() }));

import Detail from './Detail.vue';

const legacyOrder = { id: 'order-id', state: 'Pending', price: 13.5, discount: 0.1 };
const appleOrder = { ...legacyOrder, price: 18.99, discount: 0, pay_way: 'AppleIAP' };

const context = () => ({
  id: 'order-id',
  order: undefined,
  loading: false,
  prepaying: false,
  paying: false,
  payWay: 'AppleIAP',
  selectedPayWay: () => 'AppleIAP',
  startOrderPolling: vi.fn()
});

describe('iOS order pricing before native payment', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ios.mockReturnValue(true);
    refresh.mockResolvedValue({ data: legacyOrder });
    pay.mockResolvedValue({ data: appleOrder });
  });

  it('shows the server Apple quote when opening a legacy pending order', async () => {
    const ctx = context();
    Detail.methods!.onFetchData.call(ctx as never);
    await flushPromises();
    expect(pay).toHaveBeenCalledWith('order-id', { pay_way: 'AppleIAP' });
    expect(ctx.order).toEqual(appleOrder);
    expect(ctx.loading).toBe(false);
  });

  it('does not reprice historical finished orders or web pending orders', async () => {
    refresh.mockResolvedValueOnce({ data: { ...legacyOrder, state: 'Finished' } });
    Detail.methods!.onFetchData.call(context() as never);
    await flushPromises();
    ios.mockReturnValue(false);
    Detail.methods!.onFetchData.call(context() as never);
    await flushPromises();
    expect(pay).not.toHaveBeenCalled();
  });

  it('opens native payment only after the server quote succeeds', async () => {
    const ctx = context();
    Detail.methods!.onPay.call(ctx as never);
    expect(ctx.paying).toBe(false);
    await flushPromises();
    expect(ctx.order).toEqual(appleOrder);
    expect(ctx.paying).toBe(true);
  });

  it('does not start a purchase after server preparation fails', async () => {
    pay.mockRejectedValue(new Error('unavailable Apple price'));
    const ctx = context();
    Detail.methods!.onPay.call(ctx as never);
    await flushPromises();
    expect(ctx.paying).toBe(false);
    expect(ctx.startOrderPolling).not.toHaveBeenCalled();
  });
});
