// Apple In-App Purchase (StoreKit) flow via cordova-plugin-purchase.
// Used only on the iOS surface to satisfy App Store Guideline 3.1.1: the
// user buys a consumable, we hand the resulting StoreKit transaction id to
// our backend (/orders/{id}/apple-verify/) which verifies it server-to-server
// with Apple and credits the order.
//
// NOTE: cordova-plugin-purchase is a Cordova plugin — Capacitor auto-loads it
// and exposes a GLOBAL `window.CdvPurchase`. We must NOT `import` it (that
// throws in the webview); we wait for the global to appear instead.
import { orderOperator } from '@/operators';
import { isIOS } from './surface';

export interface IapResult {
  ok: boolean;
  transactionId?: string;
  cancelled?: boolean;
  error?: string;
  verificationPending?: boolean;
}

let initialized = false;
const registeredProducts = new Set<string>();
let activePurchase: { orderId: string; promise: Promise<IapResult> } | undefined;
const pendingKey = 'apple-iap-pending-transactions';
type PendingPurchase = { orderId: string; productId: string; transactionId: string };
let pendingPurchases: Record<string, PendingPurchase> = {};

function readPending(): Record<string, PendingPurchase> {
  try {
    const saved = JSON.parse(window.localStorage.getItem(pendingKey) || '{}');
    for (const [id, value] of Object.entries(saved)) {
      const item = value as PendingPurchase;
      if (item?.orderId === id && item.productId && /^\d+$/.test(item.transactionId)) {
        pendingPurchases[id] = item;
      }
    }
  } catch {
    // Keep the in-memory receipt when device storage is unavailable.
  }
  return pendingPurchases;
}

function savePending(item: PendingPurchase) {
  pendingPurchases[item.orderId] = item;
  persistPending();
}

function clearPending(orderId: string) {
  delete pendingPurchases[orderId];
  persistPending();
}

function persistPending() {
  try {
    window.localStorage.setItem(pendingKey, JSON.stringify(pendingPurchases));
  } catch {
    // Verification still retries against the original order in this session.
  }
}

function credited(data: any, transactionId: string): boolean {
  return data?.state === 'Finished' && data?.pay_id === transactionId;
}

function matchesProduct(transaction: any, productId: string): boolean {
  return (
    /^\d+$/.test(String(transaction?.transactionId || '')) &&
    transaction?.products?.some((product: any) => product.id === productId)
  );
}

function getCdv(): any | undefined {
  return (window as any).CdvPurchase;
}

// The cordova bridge attaches `CdvPurchase` shortly after deviceready, which
// can be after our Vue code runs — poll briefly for it.
async function waitForCdv(timeoutMs = 8000): Promise<any | undefined> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const cdv = getCdv();
    if (cdv?.store) {
      return cdv;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return getCdv();
}

/**
 * Purchase `productId` via StoreKit and verify the transaction against our
 * backend for `orderId`. Resolves once the order is verified (or fails /
 * is cancelled). Never throws.
 */
export async function purchaseAndVerify(orderId: string, productId: string, signal?: AbortSignal): Promise<IapResult> {
  if (signal?.aborted) return { ok: false, cancelled: true };
  if (activePurchase) {
    if (activePurchase.orderId === orderId) return activePurchase.promise;
    return { ok: false, error: 'purchase_in_progress' };
  }
  const promise = runPurchase(orderId, productId, signal);
  activePurchase = { orderId, promise };
  try {
    return await promise;
  } finally {
    if (activePurchase?.promise === promise) activePurchase = undefined;
  }
}

async function runPurchase(orderId: string, productId: string, signal?: AbortSignal): Promise<IapResult> {
  if (!isIOS()) {
    return { ok: false, error: 'iap_only_ios' };
  }
  if (!productId) {
    return { ok: false, error: 'missing_product_id' };
  }
  const CdvPurchase = await waitForCdv();
  if (signal?.aborted) return { ok: false, cancelled: true };
  if (!CdvPurchase?.store) {
    return { ok: false, error: 'iap_unavailable' };
  }
  const { store, ProductType, Platform, ErrorCode } = CdvPurchase;
  try {
    store.register([{ id: productId, type: ProductType.CONSUMABLE, platform: Platform.APPLE_APPSTORE }]);
    if (!initialized) {
      const errors = await store.initialize([Platform.APPLE_APPSTORE]);
      if (errors?.length) return { ok: false, error: errors[0].message || 'iap_unavailable' };
      initialized = true;
    } else if (!registeredProducts.has(productId)) {
      // update() normally skips calls for ten minutes after initialization.
      // A newly selected package needs its offer loaded before checkout.
      const previousInterval = store.minTimeBetweenUpdates;
      try {
        store.minTimeBetweenUpdates = 0;
        await store.update();
      } finally {
        store.minTimeBetweenUpdates = previousInterval;
      }
    }
    registeredProducts.add(productId);
  } catch (e: any) {
    return { ok: false, error: e?.message || 'iap_unavailable' };
  }
  if (signal?.aborted) return { ok: false, cancelled: true };

  const pending = readPending()[orderId];
  if (pending) {
    try {
      const refreshed = await orderOperator.refresh(orderId);
      if (!credited(refreshed.data, pending.transactionId)) {
        const verified = await orderOperator.appleVerify(orderId, pending.transactionId);
        if (!credited(verified.data, pending.transactionId)) throw new Error('verify_pending');
      }
      const transaction = store.localTransactions?.find((item: any) => item.transactionId === pending.transactionId);
      if (transaction && (await transaction.finish())) throw new Error('finish_pending');
      clearPending(orderId);
      return { ok: true, transactionId: pending.transactionId };
    } catch {
      return { ok: false, transactionId: pending.transactionId, verificationPending: true, error: 'verify_pending' };
    }
  }
  if (Object.values(readPending()).some((item) => item.productId === productId)) {
    return { ok: false, verificationPending: true, error: 'purchase_pending_verification' };
  }

  return new Promise<IapResult>((resolve) => {
    let settled = false;
    let verifying = false;
    let purchaseStarted = false;
    const finish = (r: IapResult) => {
      if (!settled) {
        settled = true;
        store.off(onApproved);
        store.off(onError);
        signal?.removeEventListener('abort', onAbort);
        resolve(r);
      }
    };

    // Approved → verify with our backend → finish the StoreKit transaction so
    // the consumable can be bought again later.
    const onApproved = async (transaction: any) => {
      // Application receipts and other products are also broadcast here.
      // Never let an old or completed purchase callback claim a new payment.
      if (settled || verifying || !purchaseStarted || !matchesProduct(transaction, productId)) return;
      if (transaction.appAccountToken && String(transaction.appAccountToken).toLowerCase() !== orderId.toLowerCase())
        return;
      verifying = true;
      const txId = String(transaction.transactionId);
      savePending({ orderId, productId, transactionId: txId });
      try {
        const verified = await orderOperator.appleVerify(orderId, txId);
        if (!credited(verified.data, txId)) throw new Error('verify_pending');
        if (await transaction.finish()) throw new Error('finish_pending');
        clearPending(orderId);
        finish({ ok: true, transactionId: txId });
      } catch {
        // A paid receipt must be retried for this order, never purchased again.
        finish({ ok: false, transactionId: txId, verificationPending: true, error: 'verify_pending' });
      }
    };

    const onError = (err: any) => {
      if (settled || verifying || (err?.productId && err.productId !== productId)) return;
      const cancelled = err?.code === ErrorCode?.PAYMENT_CANCELLED;
      finish({ ok: false, cancelled, error: err?.message || 'iap_error' });
    };
    const onAbort = () => {
      // Once the native payment starts it still belongs to this order, even
      // if the user leaves its page. Cancel only before opening checkout.
      if (!purchaseStarted && !verifying) finish({ ok: false, cancelled: true });
    };
    store.when().approved(onApproved);
    store.error(onError);
    signal?.addEventListener('abort', onAbort, { once: true });

    (async () => {
      try {
        // Products load asynchronously from Apple after initialize/update —
        // poll until the offer is available (race + sandbox propagation),
        // up to ~15s, before giving up.
        let offer = store.get(productId, Platform.APPLE_APPSTORE)?.getOffer();
        let waited = 0;
        while (!offer && waited < 15000) {
          await store.update().catch(() => {});
          if (settled || signal?.aborted) {
            onAbort();
            return;
          }
          await new Promise((r) => setTimeout(r, 1500));
          waited += 1500;
          offer = store.get(productId, Platform.APPLE_APPSTORE)?.getOffer();
        }
        if (settled || signal?.aborted) {
          onAbort();
          return;
        }
        if (!offer) {
          finish({ ok: false, error: 'product_not_found' });
          return;
        }
        // Do not attach restored/unconfirmed receipts to a new order.
        if (
          store.localTransactions?.some(
            (item: any) => matchesProduct(item, productId) && item.state === CdvPurchase.TransactionState?.APPROVED
          )
        ) {
          finish({ ok: false, verificationPending: true, error: 'purchase_pending_verification' });
          return;
        }
        // In this SDK version Apple reads the username from the store. A raw
        // order UUID becomes the signed appAccountToken for this purchase.
        store.applicationUsername = orderId;
        store.obfuscator = 'disabled';
        purchaseStarted = true;
        const error = await store.order(offer);
        if (error && !verifying) onError(error);
      } catch (e: any) {
        if (!verifying) finish({ ok: false, error: e?.message || 'order_failed' });
      }
    })();
  });
}
