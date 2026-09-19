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
      expect(page).toContain("this.payWay === PayWay.Card && isFeatureEnabled('airwallex')");
      expect(page).toContain('redirectToAirwallexCheckout(payment)');
      expect(page).toContain('this.order?.pay_way === PayWay.Airwallex');
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
});

describe('Electron Airwallex checkout boundary', () => {
  it('requires the main app frame and a separately validated checkout URL', () => {
    const main = source('electron/main.ts');
    expect(main).toContain('event.senderFrame !== event.sender.mainFrame');
    expect(main).toContain('!isAppOrigin(event.senderFrame?.url)');
    expect(main).toContain('normalizeAirwallexCheckoutUrl(url)');
  });
});
