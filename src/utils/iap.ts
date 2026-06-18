// Apple In-App Purchase (StoreKit) flow via cordova-plugin-purchase.
// Used only on the iOS surface to satisfy App Store Guideline 3.1.1: the
// user buys a consumable, we hand the resulting StoreKit transaction id to
// our backend (/orders/{id}/apple-verify/) which verifies it server-to-server
// with Apple and credits the order. The plugin is dynamically imported so it
// never ships in the web / Android bundle.
import { orderOperator } from '@/operators';
import { isIOS } from './surface';

export interface IapResult {
  ok: boolean;
  transactionId?: string;
  cancelled?: boolean;
  error?: string;
}

let initialized = false;

// cordova-plugin-purchase attaches a global `CdvPurchase` once imported.
function getCdv(): any | undefined {
  return (window as any).CdvPurchase;
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
  try {
    // Indirect specifier so the bundler/type-checker doesn't statically
    // resolve this native-only plugin (absent from the web/Android build).
    const pluginName = 'cordova-plugin-purchase';
    await import(/* @vite-ignore */ pluginName);
  } catch (e) {
    return { ok: false, error: 'iap_plugin_unavailable' };
  }
  const CdvPurchase = getCdv();
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
        await store.update();
        const product = store.get(productId, Platform.APPLE_APPSTORE);
        const offer = product?.getOffer();
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
