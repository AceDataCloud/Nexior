import { getCookie, removeCookie, setCookie } from 'typescript-cookie';

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'] as const;
const ENTRIES = new Set(['sunomcp', 'midjourneymcp', 'seedancemcp', 'nexior', 'skills']);
const COOKIE_OPTIONS = { path: '/', domain: '.acedata.cloud', secure: true, sameSite: 'Lax' as const };
let pendingCapture: Promise<void> | undefined;
let capturedQuery: string | undefined;

const canTrack = (): boolean => {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  if (host !== 'acedata.cloud' && !host.endsWith('.acedata.cloud')) return false;
  if ((window as unknown as { __PUBLIC_INVOICE_UPLOAD__?: boolean }).__PUBLIC_INVOICE_UPLOAD__) return false;
  if (
    typeof navigator !== 'undefined' &&
    ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl || navigator.doNotTrack === '1')
  )
    return false;
  try {
    return localStorage.getItem('ace-ga4-consent') !== 'denied';
  } catch {
    return false;
  }
};

/** Existing page URLs work even when this optional endpoint is absent/offline. */
export const captureMarketingTouch = (query: URLSearchParams): Promise<void> => {
  if (!canTrack() || !UTM_KEYS.some((key) => query.has(key))) return Promise.resolve();
  const tags = Object.fromEntries(UTM_KEYS.map((key) => [key, query.get(key)?.trim().slice(0, 255) || '']));
  const key = JSON.stringify(tags);
  if (capturedQuery === key) return pendingCapture || Promise.resolve();
  capturedQuery = key;
  // A new campaign must never bind an old visit if collection fails.
  try {
    removeCookie('MARKETING_TOUCH', COOKIE_OPTIONS);
  } catch {
    return Promise.resolve();
  }
  if (!ENTRIES.has(tags.utm_source) || tags.utm_campaign !== 'opensource_activation') return Promise.resolve();
  pendingCapture = (async () => {
    try {
      const response = await fetch('https://platform.acedata.cloud/api/v1/marketing-attribution/visits/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({ entry: tags.utm_source, ...tags }),
        keepalive: true,
        signal: AbortSignal.timeout(3000)
      });
      if (!response.ok) return;
      const data = await response.json();
      if (capturedQuery !== key || !canTrack() || typeof data.touch !== 'string') return;
      setCookie('MARKETING_TOUCH', data.touch, { ...COOKIE_OPTIONS, expires: new Date(Date.now() + 7 * 86400000) });
    } catch {
      // Navigation, signup and service access must not depend on telemetry.
    }
  })();
  return pendingCapture;
};

/** Called in the background: failures must never delay login or OAuth consent. */
export const bindMarketingTouch = async (access?: string): Promise<void> => {
  if (!access || !canTrack()) return;
  await pendingCapture;
  if (!canTrack()) return;
  try {
    const touch = getCookie('MARKETING_TOUCH');
    if (!touch) return;
    await fetch('https://platform.acedata.cloud/api/v1/marketing-attribution/bind/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      credentials: 'omit',
      body: JSON.stringify({ touch }),
      keepalive: true,
      signal: AbortSignal.timeout(3000)
    });
  } catch {
    // A tracking outage must never block login or consent.
  }
};
