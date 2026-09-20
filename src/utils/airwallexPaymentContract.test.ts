import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Airwallex card routing contract', () => {
  it.each(['src/pages/console/order/Detail.vue', 'src/pages/order/Pay.vue'])(
    'routes feature-gated Card checkout through Airwallex in %s',
    (path) => {
      const page = source(path);
      expect(page).toContain('PayWay.Airwallex');
      expect(page).toContain('this.payWay === PayWay.Card && this.airwallexEnabled');
      expect(page).toContain('redirectToAirwallexCheckout(payment)');
      expect(page).toContain('this.order?.pay_way === PayWay.Airwallex');
      expect(page).toContain("payload.payment_contract = 'airwallex_payment_intent'");
      expect(page).toContain('supportsAirwallexPaymentIntent()');
      expect(page).not.toContain('ENABLE_AIRWALLEX_3DS');
    }
  );

  it('uses the anonymous client for public order loading, polling, and payment', () => {
    const publicPage = source('src/pages/order/Pay.vue');
    expect(publicPage).toContain('.payPublic(this.id');
    expect(publicPage.match(/\.getPublic\(this\.id\)/g)).toHaveLength(2);
    expect(publicPage).not.toContain('.get(this.id)');
  });

  it('preserves native and alternative payment paths', () => {
    const consolePage = source('src/pages/console/order/Detail.vue');
    expect(consolePage).toContain('this.payWay === PayWay.Apple');
    expect(consolePage).toContain('selectedPayWay === PayWay.Stripe && isAndroid()');
    expect(consolePage).toContain("payload.surface = 'android'");
    expect(consolePage).toContain('PayWay.X402');
    expect(consolePage).toContain('OrderState.FINISHED');
  });

  it('keeps existing payment polling behavior and Airwallex out of Stripe dialogs', () => {
    for (const path of ['src/pages/console/order/Detail.vue', 'src/pages/order/Pay.vue']) {
      const page = source(path);
      expect(page).toContain('payWay === PayWay.Stripe || payWay === PayWay.Card');
      expect(page).not.toContain('MAX_ORDER_POLL_ATTEMPTS');
      expect(page).not.toContain('payWay === PayWay.Airwallex)"');
    }
  });

  it('keeps the PaymentIntent secret transient', () => {
    const models = source('src/models/order.ts');
    const order = models.match(/export interface IOrder \{[\s\S]*?\n\}/)?.[0] || '';
    expect(order).not.toContain('client_secret');
    for (const path of [
      'src/pages/console/order/Detail.vue',
      'src/pages/order/Pay.vue',
      'src/operators/order.ts',
      'electron/main.ts',
      'electron/payment.ts'
    ]) {
      expect(source(path)).not.toContain('client_secret');
    }
  });
});

describe('Electron Airwallex checkout boundary', () => {
  it('requires the main app frame and a separately validated checkout URL', () => {
    const main = source('electron/main.ts');
    expect(main).toContain('event.senderFrame !== event.sender.mainFrame');
    expect(main).toContain('!isAppOrigin(event.senderFrame?.url)');
    expect(main).toContain('normalizeAirwallexCheckoutUrl(url)');
  });
  it('never adds a feature-override header to cross-origin payment requests', () => {
    const operator = source('src/operators/order.ts');
    expect(operator).not.toContain('x-feature-overrides');
    expect(operator).not.toContain('getStickyFeatureOverrides');
  });
});
