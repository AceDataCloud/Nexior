import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ appleVerify: vi.fn(), refresh: vi.fn() }));
vi.mock('@/operators', () => ({ orderOperator: api }));
vi.mock('./surface', () => ({ isIOS: () => true }));

const sku = 'com.acedatacloud.nexior.credits.100';
const first = '00000000-0000-4000-8000-000000000001';
const current = '00000000-0000-4000-8000-000000000002';
let approved: Set<(transaction: any) => Promise<void>>;
let errors: Set<(error: any) => void>;
let store: any;
let purchase: (typeof import('./iap'))['purchaseAndVerify'];
let storage: Map<string, string>;

function transaction(id = '250001', product = sku, token?: string) {
  const value: any = {
    transactionId: id,
    products: [{ id: product }],
    state: 'approved',
    appAccountToken: token
  };
  value.finish = vi.fn(async () => {
    value.state = 'finished';
  });
  return value;
}

async function started(count = 1) {
  await vi.waitFor(() => expect(store.order).toHaveBeenCalledTimes(count));
}

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();
  approved = new Set();
  errors = new Set();
  storage = new Map();
  store = {
    register: vi.fn(),
    initialize: vi.fn(async () => []),
    update: vi.fn(async () => undefined),
    minTimeBetweenUpdates: 600000,
    get: vi.fn(() => ({ getOffer: () => ({ productId: sku }) })),
    order: vi.fn(async () => undefined),
    localTransactions: [],
    when: () => ({ approved: (callback: any) => approved.add(callback) }),
    error: (callback: any) => errors.add(callback),
    off: vi.fn((callback: any) => {
      approved.delete(callback);
      errors.delete(callback);
    })
  };
  api.appleVerify.mockImplementation(async (_id, tx) => ({ data: { state: 'Finished', pay_id: tx } }));
  api.refresh.mockResolvedValue({ data: { state: 'Pending' } });
  vi.stubGlobal('window', {
    CdvPurchase: {
      store,
      ProductType: { CONSUMABLE: 'consumable' },
      Platform: { APPLE_APPSTORE: 'ios-appstore' },
      ErrorCode: { PAYMENT_CANCELLED: 'cancelled' },
      TransactionState: { APPROVED: 'approved' }
    },
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value)
    }
  });
  purchase = (await import('./iap')).purchaseAndVerify;
});

afterEach(() => vi.unstubAllGlobals());

describe('Apple IAP order isolation', () => {
  it('loads a newly selected package despite the StoreKit update throttle', async () => {
    store.order.mockResolvedValueOnce({ code: 'cancelled' });
    expect(await purchase(first, sku)).toMatchObject({ cancelled: true });
    const otherSku = 'com.acedatacloud.nexior.credits.530';
    let loaded = false;
    store.get.mockImplementation(() => (loaded ? { getOffer: () => ({ productId: otherSku }) } : undefined));
    store.update.mockImplementation(async () => {
      if (store.minTimeBetweenUpdates === 0) loaded = true;
    });
    const result = purchase(current, otherSku);
    await started(2);
    await [...approved][0](transaction('250002', otherSku));
    expect(await result).toMatchObject({ ok: true });
    expect(store.minTimeBetweenUpdates).toBe(600000);
    expect(store.initialize).toHaveBeenCalledOnce();
  });
  it('ignores the app receipt and other SKUs, then verifies only the purchased product', async () => {
    const result = purchase(current, sku);
    await started();
    const callback = [...approved][0];
    await callback(transaction('appstore.application', 'com.acedatacloud.nexior'));
    await callback(transaction('250002', 'com.acedatacloud.nexior.credits.530'));
    await callback(transaction('250003', sku, first));
    expect(api.appleVerify).not.toHaveBeenCalled();
    const bought = transaction('250004', sku, current);
    await callback(bought);
    expect(await result).toMatchObject({ ok: true, transactionId: '250004' });
    expect(api.appleVerify).toHaveBeenCalledExactlyOnceWith(current, '250004');
    expect(bought.finish).toHaveBeenCalledOnce();
    expect(approved.size).toBe(0);
    expect(errors.size).toBe(0);
    expect(store.applicationUsername).toBe(current);
    expect(store.obfuscator).toBe('disabled');
  });

  it('does not let a cancelled old order claim the next order payment, even if its event was queued', async () => {
    const oldResult = purchase(first, sku);
    await started();
    const oldCallback = [...approved][0];
    [...errors][0]({ code: 'cancelled' });
    expect(await oldResult).toMatchObject({ ok: false, cancelled: true });
    const newResult = purchase(current, sku);
    await started(2);
    const actual = transaction();
    await oldCallback(actual);
    expect(api.appleVerify).not.toHaveBeenCalled();
    await [...approved][0](actual);
    expect(await newResult).toMatchObject({ ok: true });
    expect(api.appleVerify).toHaveBeenCalledExactlyOnceWith(current, actual.transactionId);
  });

  it('serializes the purchase flow and ignores repeated approved events while verification is pending', async () => {
    let verified!: (value: any) => void;
    api.appleVerify.mockImplementation(
      () =>
        new Promise((resolve) => {
          verified = resolve;
        })
    );
    const result = purchase(current, sku);
    await started();
    expect(await purchase(first, sku)).toMatchObject({ ok: false, error: 'purchase_in_progress' });
    const actual = transaction();
    const callback = [...approved][0];
    const inFlight = callback(actual);
    await callback(actual);
    expect(api.appleVerify).toHaveBeenCalledOnce();
    verified({ data: { state: 'Finished', pay_id: actual.transactionId } });
    await inFlight;
    expect(await result).toMatchObject({ ok: true });
  });

  it('retries a paid receipt for its original order without opening another Apple purchase', async () => {
    api.appleVerify.mockRejectedValueOnce(new Error('network failure'));
    const result = purchase(current, sku);
    await started();
    const actual = transaction();
    store.localTransactions.push(actual);
    await [...approved][0](actual);
    expect(await result).toMatchObject({ ok: false, verificationPending: true });
    expect(actual.finish).not.toHaveBeenCalled();
    expect(approved.size).toBe(0);
    expect(await purchase(first, sku)).toMatchObject({ ok: false, verificationPending: true });
    expect(await purchase(current, sku)).toMatchObject({ ok: true });
    expect(store.order).toHaveBeenCalledOnce();
    expect(api.appleVerify.mock.calls).toEqual([
      [current, actual.transactionId],
      [current, actual.transactionId]
    ]);
    expect(actual.finish).toHaveBeenCalledOnce();
  });

  it('recovers a lost server response by reading the finished order before retrying verification', async () => {
    api.appleVerify.mockRejectedValueOnce(new Error('response lost'));
    const result = purchase(current, sku);
    await started();
    const actual = transaction();
    store.localTransactions.push(actual);
    await [...approved][0](actual);
    expect(await result).toMatchObject({ verificationPending: true });
    api.refresh.mockResolvedValue({ data: { state: 'Finished', pay_id: actual.transactionId } });
    expect(await purchase(current, sku)).toMatchObject({ ok: true });
    expect(api.appleVerify).toHaveBeenCalledOnce();
    expect(store.order).toHaveBeenCalledOnce();
  });

  it('reloads StoreKit before acknowledging a paid receipt saved across an app restart', async () => {
    api.appleVerify.mockRejectedValueOnce(new Error('connection lost'));
    const result = purchase(current, sku);
    await started();
    const actual = transaction();
    await [...approved][0](actual);
    expect(await result).toMatchObject({ verificationPending: true });
    vi.resetModules();
    store.localTransactions = [];
    store.initialize.mockImplementation(async () => {
      store.localTransactions.push(actual);
      return [];
    });
    purchase = (await import('./iap')).purchaseAndVerify;
    expect(await purchase(current, sku)).toMatchObject({ ok: true });
    expect(actual.finish).toHaveBeenCalledOnce();
    expect(store.initialize).toHaveBeenCalledTimes(2);
    expect(store.order).toHaveBeenCalledOnce();
  });

  it('handles StoreKit cancellation returned by order() and unregisters both listeners', async () => {
    store.order.mockResolvedValue({ code: 'cancelled', message: 'cancelled' });
    expect(await purchase(current, sku)).toMatchObject({ ok: false, cancelled: true });
    expect(approved.size).toBe(0);
    expect(errors.size).toBe(0);
    expect(api.appleVerify).not.toHaveBeenCalled();
  });

  it('does not start another payment when an unmapped approved receipt still exists', async () => {
    store.localTransactions.push(transaction());
    expect(await purchase(current, sku)).toMatchObject({ ok: false, verificationPending: true });
    expect(store.order).not.toHaveBeenCalled();
    expect(api.appleVerify).not.toHaveBeenCalled();
    expect(approved.size).toBe(0);
  });

  it('does not open a delayed checkout after its order page is closed', async () => {
    let loaded!: () => void;
    store.get.mockReturnValue(undefined);
    store.update.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          loaded = resolve;
        })
    );
    const controller = new AbortController();
    const result = purchase(current, sku, controller.signal);
    await vi.waitFor(() => expect(store.update).toHaveBeenCalledOnce());
    controller.abort();
    expect(await result).toMatchObject({ cancelled: true });
    store.get.mockReturnValue({ getOffer: () => ({ productId: sku }) });
    loaded();
    await Promise.resolve();
    expect(store.order).not.toHaveBeenCalled();
    expect(approved.size).toBe(0);
  });

  it('keeps an already opened native checkout bound to its original order after navigation', async () => {
    const controller = new AbortController();
    const result = purchase(first, sku, controller.signal);
    await started();
    controller.abort();
    expect(await purchase(current, sku)).toMatchObject({ ok: false, error: 'purchase_in_progress' });
    await [...approved][0](transaction());
    expect(await result).toMatchObject({ ok: true });
    expect(api.appleVerify).toHaveBeenCalledExactlyOnceWith(first, '250001');
    expect(store.order).toHaveBeenCalledOnce();
  });
});
