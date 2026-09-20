// @vitest-environment jsdom
// @vitest-environment-options {"url":"https://studio.acedata.cloud/"}
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { browserOpen, bridgeOpen, redirectToCheckout, sdkInit, surface } = vi.hoisted(() => ({
  browserOpen: vi.fn(),
  bridgeOpen: vi.fn(),
  redirectToCheckout: vi.fn(),
  sdkInit: vi.fn(),
  surface: { value: 'web', paymentIntent: true }
}));

vi.mock('@capacitor/browser', () => ({ Browser: { open: browserOpen } }));
vi.mock('@airwallex/components-sdk', () => ({ init: sdkInit }));
vi.mock('./desktop', () => ({ desktopBridge: () => ({ openAirwallexCheckout: bridgeOpen }) }));
vi.mock('./surface', () => ({
  isAndroid: () => surface.value === 'android',
  isDesktop: () => surface.value === 'desktop',
  isIOS: () => surface.value === 'ios',
  supportsAirwallexPaymentIntent: () => surface.paymentIntent
}));

import { redirectToAirwallexCheckout } from './airwallexCheckout';

const billingPayment = {
  provider: 'airwallex' as const,
  flow: 'billing_checkout' as const,
  checkout_id: 'bco_test',
  url: 'https://checkout.airwallex.com/session/test'
};

const intentPayment = {
  provider: 'airwallex' as const,
  flow: 'payment_intent_hpp' as const,
  intent_id: 'int_test',
  client_secret: 'secret_test',
  currency: 'USD' as const,
  environment: 'prod' as const,
  success_url: 'https://studio.acedata.cloud/console/orders/order-id?airwallex_return=success'
};

describe('redirectToAirwallexCheckout', () => {
  beforeEach(() => {
    surface.value = 'web';
    surface.paymentIntent = true;
    browserOpen.mockReset();
    bridgeOpen.mockReset();
    redirectToCheckout.mockReset();
    sdkInit.mockReset().mockResolvedValue({ payments: { redirectToCheckout } });
  });

  it('opens a validated billing checkout in the Android browser', async () => {
    surface.value = 'android';
    await redirectToAirwallexCheckout(billingPayment);
    expect(browserOpen).toHaveBeenCalledWith({ url: billingPayment.url });
    expect(bridgeOpen).not.toHaveBeenCalled();
  });

  it('opens a validated billing checkout through the desktop bridge', async () => {
    surface.value = 'desktop';
    await redirectToAirwallexCheckout(billingPayment);
    expect(bridgeOpen).toHaveBeenCalledWith(billingPayment.url);
    expect(browserOpen).not.toHaveBeenCalled();
  });

  it.each([
    'http://checkout.airwallex.com/session/test',
    'https://checkout.airwallex.com.evil.example/session/test',
    'https://foo.checkout.airwallex.com/session/test',
    'https://user:password@checkout.airwallex.com/session/test'
  ])('rejects an unsafe billing checkout URL: %s', async (url) => {
    await expect(redirectToAirwallexCheckout({ ...billingPayment, url })).rejects.toThrow(
      'Invalid Airwallex billing checkout URL'
    );
  });

  it('rejects incomplete or unexpected billing checkout envelopes', async () => {
    await expect(redirectToAirwallexCheckout({ ...billingPayment, checkout_id: '' })).rejects.toThrow(
      'Incomplete Airwallex billing checkout'
    );
    await expect(
      redirectToAirwallexCheckout({ ...billingPayment, provider: 'other' } as unknown as typeof billingPayment)
    ).rejects.toThrow('Invalid Airwallex payment provider');
  });

  it('never opens external billing checkout on iOS', async () => {
    surface.value = 'ios';
    await expect(redirectToAirwallexCheckout(billingPayment)).rejects.toThrow('unavailable on iOS');
    expect(browserOpen).not.toHaveBeenCalled();
    expect(bridgeOpen).not.toHaveBeenCalled();
  });

  it('starts card-only PaymentIntent checkout on HTTPS web', async () => {
    await redirectToAirwallexCheckout(intentPayment);

    expect(sdkInit).toHaveBeenCalledWith({ env: 'prod', enabledElements: ['payments'] });
    expect(redirectToCheckout).toHaveBeenCalledWith({
      mode: 'payment',
      intent_id: 'int_test',
      client_secret: 'secret_test',
      currency: 'USD',
      methods: ['card'],
      requiredBillingContactFields: ['name', 'email', 'address'],
      successUrl: intentPayment.success_url,
      autoCapture: true
    });
    expect(browserOpen).not.toHaveBeenCalled();
    expect(bridgeOpen).not.toHaveBeenCalled();
  });

  it('rejects cross-origin PaymentIntent success URLs before loading the SDK', async () => {
    await expect(
      redirectToAirwallexCheckout({ ...intentPayment, success_url: 'https://platform.acedata.cloud/orders/order-id' })
    ).rejects.toThrow('Invalid Airwallex success URL');
    expect(sdkInit).not.toHaveBeenCalled();
  });

  it('fails closed for PaymentIntent on unsupported surfaces', async () => {
    surface.paymentIntent = false;
    await expect(redirectToAirwallexCheckout(intentPayment)).rejects.toThrow('requires HTTPS web');
    expect(sdkInit).not.toHaveBeenCalled();
    expect(browserOpen).not.toHaveBeenCalled();
    expect(bridgeOpen).not.toHaveBeenCalled();
  });

  it('rejects incomplete PaymentIntent envelopes', async () => {
    await expect(redirectToAirwallexCheckout({ ...intentPayment, client_secret: '' })).rejects.toThrow(
      'Incomplete Airwallex PaymentIntent checkout'
    );
    expect(sdkInit).not.toHaveBeenCalled();
  });

  it('does not expose SDK redirect errors', async () => {
    redirectToCheckout.mockReturnValue('sensitive provider error');
    await expect(redirectToAirwallexCheckout(intentPayment)).rejects.toThrow('Airwallex checkout could not start');
  });
});
