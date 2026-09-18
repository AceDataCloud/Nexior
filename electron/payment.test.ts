import { describe, expect, it } from 'vitest';
import { normalizeAirwallexCheckoutUrl } from './payment';

describe('normalizeAirwallexCheckoutUrl', () => {
  it('accepts the exact HTTPS checkout host', () => {
    expect(normalizeAirwallexCheckoutUrl('https://checkout.airwallex.com/session/test')).toBe(
      'https://checkout.airwallex.com/session/test'
    );
  });

  it.each([
    'http://checkout.airwallex.com/session/test',
    'https://checkout.airwallex.com.evil.example/session/test',
    'https://foo.checkout.airwallex.com/session/test',
    'https://user:password@checkout.airwallex.com/session/test',
    'not-a-url'
  ])('rejects unsafe checkout URL %s', (url) => {
    expect(normalizeAirwallexCheckoutUrl(url)).toBeUndefined();
  });
});
