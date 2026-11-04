export function coingateCheckoutUrl(value?: string, environment?: string): string | undefined {
  if (!value || !['sandbox', 'live'].includes(environment || '')) return undefined;
  try {
    const url = new URL(value);
    const hosts = environment === 'sandbox' ? ['sandbox.coingate.com'] : ['coingate.com', 'pay.coingate.com'];
    if (
      url.protocol !== 'https:' ||
      !hosts.includes(url.hostname) ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443') ||
      value.includes('\\')
    )
      return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
