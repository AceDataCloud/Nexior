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
}

let initialized = false;

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
export async function purchaseAndVerify(orderId: string, productId: string): Promise<IapResult> {
  if (!isIOS()) {
    return { ok: false, error: 'iap_only_ios' };
  }
  if (!productId) {
    return { ok: false, error: 'missing_product_id' };
  }
  const CdvPurchase = await waitForCdv();
  if (!CdvPurchase?.store) {
    return { ok: false, error: 'iap_unavailable' };
  }
  const { store, ProductType, Platform, ErrorCode } = CdvPurchase;

  return new Promise<IapResult>((resolve) => {
    let settled = false;
    const finish = (r: IapResult) => {
      if (!settled) {
        settled = true;
        resolve(r);
      }
    };

    store.register([{ id: productId, type: ProductType.CONSUMABLE, platform: Platform.APPLE_APPSTORE }]);

    // Approved → verify with our backend → finish the StoreKit transaction so
    // the consumable can be bought again later.
    store.when().approved(async (transaction: any) => {
      const txId = transaction?.transactionId || transaction?.id;
      try {
        await orderOperator.appleVerify(orderId, txId);
        await transaction.finish();
        finish({ ok: true, transactionId: txId });
      } catch (e: any) {
        finish({ ok: false, transactionId: txId, error: e?.response?.data?.error?.message || 'verify_failed' });
      }
    });

    store.error((err: any) => {
      const cancelled = err?.code === ErrorCode?.PAYMENT_CANCELLED;
      finish({ ok: false, cancelled, error: err?.message || 'iap_error' });
    });

    (async () => {
      try {
        if (!initialized) {
          await store.initialize([Platform.APPLE_APPSTORE]);
          initialized = true;
        }
        // Products load asynchronously from Apple after initialize/update —
        // poll until the offer is available (race + sandbox propagation),
        // up to ~15s, before giving up.
        let offer = store.get(productId, Platform.APPLE_APPSTORE)?.getOffer();
        let waited = 0;
        while (!offer && waited < 15000) {
          await store.update().catch(() => {});
          await new Promise((r) => setTimeout(r, 1500));
          waited += 1500;
          offer = store.get(productId, Platform.APPLE_APPSTORE)?.getOffer();
        }
        if (!offer) {
          finish({ ok: false, error: 'product_not_found' });
          return;
        }
        await store.order(offer);
      } catch (e: any) {
        finish({ ok: false, error: e?.message || 'order_failed' });
      }
    })();
  });
}
