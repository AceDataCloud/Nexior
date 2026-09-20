import { Browser } from '@capacitor/browser';
import { IAirwallexPayment } from '@/models';
import { desktopBridge } from '@/utils/desktop';
import { isAndroid, isDesktop, isIOS, supportsAirwallexPaymentIntent } from '@/utils/surface';

const AIRWALLEX_CHECKOUT_HOST = 'checkout.airwallex.com';

export async function redirectToAirwallexCheckout(payment: IAirwallexPayment): Promise<void> {
  if (payment.provider !== 'airwallex') throw new Error('Invalid Airwallex payment provider');
  if (payment.flow === 'billing_checkout') {
    if (!payment.checkout_id || !payment.url) throw new Error('Incomplete Airwallex billing checkout');
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
    return;
  }
  if (!supportsAirwallexPaymentIntent()) throw new Error('Airwallex PaymentIntent checkout requires HTTPS web');
  if (
    !payment.intent_id ||
    !payment.client_secret ||
    payment.currency !== 'USD' ||
    !['demo', 'prod'].includes(payment.environment)
  ) {
    throw new Error('Incomplete Airwallex PaymentIntent checkout');
  }
  const successUrl = new URL(payment.success_url);
  if (
    successUrl.protocol !== 'https:' ||
    successUrl.origin !== window.location.origin ||
    successUrl.username ||
    successUrl.password
  ) {
    throw new Error('Invalid Airwallex success URL');
  }
  const { init } = await import('@airwallex/components-sdk');
  const { payments } = await init({ env: payment.environment, enabledElements: ['payments'] });
  if (!payments) throw new Error('Airwallex payments SDK unavailable');
  const redirectError = payments.redirectToCheckout({
    mode: 'payment',
    intent_id: payment.intent_id,
    client_secret: payment.client_secret,
    currency: payment.currency,
    methods: ['card'],
    requiredBillingContactFields: ['name', 'email', 'address'],
    successUrl: successUrl.toString(),
    autoCapture: true
  });
  if (typeof redirectError === 'string' && redirectError) throw new Error('Airwallex checkout could not start');
}
