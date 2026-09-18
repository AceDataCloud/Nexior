const AIRWALLEX_CHECKOUT_HOST = 'checkout.airwallex.com';

export function normalizeAirwallexCheckoutUrl(value: string): string | undefined {
  try {
    const checkout = new URL(value);
    if (
      checkout.protocol !== 'https:' ||
      checkout.hostname !== AIRWALLEX_CHECKOUT_HOST ||
      checkout.username ||
      checkout.password
    ) {
      return undefined;
    }
    return checkout.toString();
  } catch {
    return undefined;
  }
}
