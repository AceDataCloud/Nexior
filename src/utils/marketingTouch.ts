import { getCookie } from 'typescript-cookie';

/** Bind a signed first-party CTA visit. This is analytics, never an auth prerequisite. */
export const bindMarketingTouch = async (access?: string): Promise<void> => {
  if (typeof window === 'undefined' || !access) return;
  const host = window.location.hostname;
  if (host !== 'acedata.cloud' && !host.endsWith('.acedata.cloud')) return;
  const touch = getCookie('MARKETING_TOUCH');
  if (!touch) return;
  try {
    await fetch('https://platform.acedata.cloud/api/v1/marketing-attribution/bind/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ touch }),
      signal: AbortSignal.timeout(3000)
    });
  } catch {
    // A tracking outage must never block login or consent.
  }
};
