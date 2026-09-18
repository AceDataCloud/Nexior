import { Browser } from '@capacitor/browser';
import { IAirwallexBillingCheckoutPayment } from '@/models';
import { desktopBridge } from '@/utils/desktop';
import { isAndroid, isDesktop, isIOS } from '@/utils/surface';

const AIRWALLEX_CHECKOUT_HOST = 'checkout.airwallex.com';

export async function redirectToAirwallexCheckout(payment: IAirwallexBillingCheckoutPayment): Promise<void> {
  if (payment.provider !== 'airwallex' || payment.flow !== 'billing_checkout' || !payment.checkout_id || !payment.url) {
    throw new Error('Incomplete Airwallex billing checkout');
  }
  const checkoutUrl = new URL(payment.url);
  if (
    checkoutUrl.protocol !== 'https:' ||
    checkoutUrl.hostname !== AIRWALLEX_CHECKOUT_HOST ||
    checkoutUrl.username ||
    checkoutUrl.password
  ) {
    throw new Error('Invalid Airwallex billing checkout URL');
  }
  const url = checkoutUrl.toString();
  if (isIOS()) throw new Error('Airwallex checkout is unavailable on iOS');
  if (isAndroid()) {
    await Browser.open({ url });
    return;
  }
  if (isDesktop()) {
    const bridge = desktopBridge();
    if (!bridge?.openAirwallexCheckout) throw new Error('Airwallex checkout requires a newer desktop app');
    await bridge.openAirwallexCheckout(url);
    return;
  }
  window.location.assign(url);
}
