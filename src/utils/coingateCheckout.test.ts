import { describe, expect, it } from 'vitest';
import { coingateCheckoutUrl } from './coingateCheckout';

describe('CoinGate checkout URL', () => {
  it('binds the URL to the server-provided payment environment', () => {
    expect(coingateCheckoutUrl('https://sandbox.coingate.com/invoice/123', 'sandbox')).toBe(
      'https://sandbox.coingate.com/invoice/123'
    );
    expect(coingateCheckoutUrl('https://pay.coingate.com/invoice/123', 'live')).toBe(
      'https://pay.coingate.com/invoice/123'
    );
    expect(coingateCheckoutUrl('https://coingate.com/invoice/123', 'sandbox')).toBeUndefined();
    expect(coingateCheckoutUrl('https://sandbox.coingate.com/invoice/123', 'live')).toBeUndefined();
    expect(coingateCheckoutUrl('https://sandbox.coingate.com/invoice/123')).toBeUndefined();
  });
  it('rejects untrusted redirects and credentials', () => {
    for (const url of [
      'javascript:alert(1)',
      'https://pay.coingate.com.evil.test/pay',
      'https://user@pay.coingate.com/pay',
      'http://pay.coingate.com/pay',
      'https://pay.coingate.com:999/pay'
    ]) {
      expect(coingateCheckoutUrl(url, 'live')).toBeUndefined();
    }
  });
});
