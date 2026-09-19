// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { browserOpen, bridgeOpen, surface } = vi.hoisted(() => ({
  browserOpen: vi.fn(),
  bridgeOpen: vi.fn(),
  surface: { value: 'web' }
}));

vi.mock('@capacitor/browser', () => ({ Browser: { open: browserOpen } }));
vi.mock('./desktop', () => ({ desktopBridge: () => ({ openAirwallexCheckout: bridgeOpen }) }));
vi.mock('./surface', () => ({
  isAndroid: () => surface.value === 'android',
  isDesktop: () => surface.value === 'desktop',
  isIOS: () => surface.value === 'ios'
}));

import { redirectToAirwallexCheckout } from './airwallexCheckout';

const payment = {
  provider: 'airwallex' as const,
  flow: 'billing_checkout' as const,
  checkout_id: 'bco_test',
  url: 'https://checkout.airwallex.com/session/test'
};

describe('redirectToAirwallexCheckout', () => {
  beforeEach(() => {
    surface.value = 'web';
    browserOpen.mockReset();
    bridgeOpen.mockReset();
  });

  it('opens a validated checkout in the Android browser', async () => {
    surface.value = 'android';
    await redirectToAirwallexCheckout(payment);
    expect(browserOpen).toHaveBeenCalledWith({ url: payment.url });
    expect(bridgeOpen).not.toHaveBeenCalled();
  });

  it('opens a validated checkout through the desktop bridge', async () => {
    surface.value = 'desktop';
    await redirectToAirwallexCheckout(payment);
    expect(bridgeOpen).toHaveBeenCalledWith(payment.url);
    expect(browserOpen).not.toHaveBeenCalled();
  });

  it.each([
    'http://checkout.airwallex.com/session/test',
    'https://checkout.airwallex.com.evil.example/session/test',
    'https://foo.checkout.airwallex.com/session/test',
    'https://user:password@checkout.airwallex.com/session/test'
  ])('rejects an unsafe checkout URL: %s', async (url) => {
    await expect(redirectToAirwallexCheckout({ ...payment, url })).rejects.toThrow(
      'Invalid Airwallex billing checkout URL'
    );
  });

  it('rejects incomplete or unexpected checkout envelopes', async () => {
    await expect(redirectToAirwallexCheckout({ ...payment, checkout_id: '' })).rejects.toThrow(
      'Incomplete Airwallex billing checkout'
    );
    await expect(
      redirectToAirwallexCheckout({ ...payment, provider: 'other' } as unknown as typeof payment)
    ).rejects.toThrow('Incomplete Airwallex billing checkout');
  });

  it('never opens external card checkout on iOS', async () => {
    surface.value = 'ios';
    await expect(redirectToAirwallexCheckout(payment)).rejects.toThrow('unavailable on iOS');
    expect(browserOpen).not.toHaveBeenCalled();
    expect(bridgeOpen).not.toHaveBeenCalled();
  });
});
