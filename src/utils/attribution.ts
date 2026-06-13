import { getCookie, setCookie } from 'typescript-cookie';
import { Clipboard } from '@capacitor/clipboard';
import { getDomain } from './domain';
import { isAndroid, isIOS, isNative } from './surface';
import { parseInviterFromReferrer } from './attributionParse';
import { InstallReferrer } from '@/plugins/installReferrer';
import { attributionOperator } from '@/operators/attribution';

// Re-export so callers (e.g. App.vue) keep importing from '@/utils/attribution'.
export { parseInviterFromDeepLink } from './attributionParse';

const INVITER_COOKIE = 'INVITER_ID';
// One-shot guard: a referral attempt must run exactly once per install, so we
// never re-read the iOS clipboard (re-triggers the paste banner) or clobber an
// already-bound inviter on later launches.
const RESOLVED_FLAG = 'ATTRIBUTION_RESOLVED';
// Backend click_id is a uuid4 hex (32 chars). Only treat clipboard content that
// matches as our token — otherwise we'd leak arbitrary clipboard data upstream.
const CLICK_ID_RE = /^[0-9a-f]{32}$/i;

/**
 * Persist a resolved inviter into the same `INVITER_ID` cookie the existing
 * login flow (`AuthPanel`, `getInviterId`) already reads. 7-day expiry mirrors
 * `initializeCookies`.
 */
export const writeInviterCookie = (inviterId: string): void => {
  if (!inviterId) return;
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 7);
  setCookie(INVITER_COOKIE, inviterId, { expires: expiration, path: '/', domain: getDomain() });
  console.debug('attribution: wrote INVITER_ID', inviterId);
};

const resolveAndroid = async (): Promise<void> => {
  let referrer = '';
  try {
    ({ referrer } = await InstallReferrer.getReferrer());
  } catch (e) {
    console.debug('attribution: install referrer unavailable', e);
    return;
  }
  const { inviterId } = parseInviterFromReferrer(referrer);
  // The referrer already carries inviter_id deterministically — no server round
  // trip needed. (Marking the click resolved server-side is best-effort and
  // skipped here to keep first launch fast.)
  if (inviterId) writeInviterCookie(inviterId);
};

const resolveIOS = async (): Promise<void> => {
  let clickId: string | undefined;
  try {
    const { value } = await Clipboard.read();
    if (value && CLICK_ID_RE.test(value.trim())) {
      clickId = value.trim();
    }
  } catch (e) {
    console.debug('attribution: clipboard read unavailable', e);
  }
  try {
    const { data } = await attributionOperator.resolve({ click_id: clickId, platform: 'ios' });
    if (data?.inviter_id) {
      console.debug('attribution: resolved inviter via', data.match_type);
      writeInviterCookie(data.inviter_id);
    }
  } catch (e) {
    console.debug('attribution: resolve failed', e);
  }
};

/**
 * Deferred-deep-link referral resolution, run once on native first launch
 * BEFORE the auth panel reads the inviter. Android is deterministic (Play
 * Install Referrer); iOS is best-effort (clipboard token, else a probabilistic
 * IP/UA match server-side). No-op on web, when already resolved, or when an
 * inviter cookie is already present.
 */
export const resolveDeferredInviterId = async (): Promise<void> => {
  if (!isNative()) return;
  if (getCookie(INVITER_COOKIE)) return;
  try {
    if (localStorage.getItem(RESOLVED_FLAG)) return;
  } catch {
    // localStorage may throw in locked-down WebViews — proceed without the guard
  }
  try {
    if (isAndroid()) {
      await resolveAndroid();
    } else if (isIOS()) {
      await resolveIOS();
    }
  } finally {
    try {
      localStorage.setItem(RESOLVED_FLAG, '1');
    } catch {
      // ignore — worst case we retry next launch
    }
  }
};
