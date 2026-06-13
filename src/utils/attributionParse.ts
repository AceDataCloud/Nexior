// Dependency-free parsers for deferred-deep-link attribution, split out from
// utils/attribution.ts (which pulls in Capacitor) so they stay unit-testable.

/**
 * Pull an inviter_id out of a universal/app-link URL — either the path form
 * `https://studio.acedata.cloud/i/<inviter_id>` or a `?inviter_id=` query.
 * Returns null when the URL carries no referral.
 */
export const parseInviterFromDeepLink = (rawUrl: string): string | null => {
  try {
    const url = new URL(rawUrl);
    const queryInviter = url.searchParams.get('inviter_id');
    if (queryInviter) return queryInviter;
    const match = url.pathname.match(/\/i\/([^/?#]+)/);
    if (match && match[1]) return decodeURIComponent(match[1]);
  } catch {
    // not a parseable URL (e.g. a bare custom-scheme callback) — ignore
  }
  return null;
};

/**
 * Split a Play Install Referrer blob ("inviter_id=abc&click_id=def") into its
 * referral parts.
 */
export const parseInviterFromReferrer = (referrer: string): { inviterId: string | null; clickId: string | null } => {
  const params = new URLSearchParams(referrer || '');
  return { inviterId: params.get('inviter_id'), clickId: params.get('click_id') };
};
