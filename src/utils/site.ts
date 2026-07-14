import { IApplication, ISite, ISiteContact } from '@/models';
import { v4 as uuid } from 'uuid';
import { BASE_HOST_HUB } from '@/constants/endpoint';
import { isNative, isDesktop } from './surface';

/**
 * Resolve the origin we send to PlatformBackend's
 * `/api/v1/sites/?origin=...` so we look up the correct Site row.
 *
 * Two rules to keep straight:
 *
 *  1. **Always return a bare hostname** (no scheme, no port).
 *     PlatformBackend stores `Site.origin` as the bare host
 *     (`studio.acedata.cloud`, not `https://studio.acedata.cloud`).
 *     The historical "official" branch returned `BASE_URL_HUB`
 *     (https://hub.acedata.cloud) which only matched because hub's
 *     Site row happened to have been bootstrapped under that exact
 *     URL form. New origins (e.g. studio) never got that special row,
 *     so the lookup returned 0 items and the bundle silently dropped
 *     all features.* — including the subsite gate.
 *
 *  2. **hub.acedata.cloud now 301-redirects to studio.acedata.cloud**
 *     in production, so the user-visible host on first-party traffic
 *     is studio. We still treat hub's host as the canonical "user
 *     hub" identifier when the bundle runs natively (Capacitor) —
 *     where `window.location.host` is `localhost` — by falling back
 *     to studio's bare host instead.
 */
const STUDIO_HOST = 'studio.acedata.cloud';

export const getSiteOrigin = (site?: ISite) => {
  // If we already have a Site row, trust its stored origin.
  if (site?.origin) {
    return site.origin;
  }
  // On native shells (Capacitor on Android / iOS) window.location.host
  // is "localhost" and useless; on desktop (Electron) it is the custom
  // scheme authority "bundle" (app://bundle) which is equally useless.
  // Both fall back to studio's bare host so the app boots against the
  // canonical first-party Site row.
  if (isNative() || isDesktop()) {
    return STUDIO_HOST;
  }
  if (typeof window === 'undefined' || !window.location?.host) {
    return STUDIO_HOST;
  }
  const host = window.location.host;
  // Local dev: synthesize a unique fake host so we don't collide with
  // any real Site row.
  if (host.includes('localhost')) {
    return `localhost-${uuid()}`;
  }
  // hub.acedata.cloud now permanently redirects to studio. If for any
  // reason the bundle is rendering on hub (cached HTML, dev override,
  // etc.) treat it as studio so we still resolve the real Site row.
  if (host === BASE_HOST_HUB) {
    return STUDIO_HOST;
  }
  // Strip an accidental ":port" if the visitor is on a non-standard
  // port; PlatformBackend never stores ports either.
  return host.split(':')[0];
};

/**
 * White-label brand-hide switches. Reads `site.branding.hide_*`
 * (PlatformBackend `Site.branding`, PR #919). Default — column unset or the
 * flag not exactly `true` — is `false`, i.e. we keep showing our brand,
 * matching the "unset = use our default" principle. Only an explicit `true`
 * hides the surface.
 */
export const isBrandingHidden = (site: ISite | null | undefined, key: 'powered_by'): boolean => {
  const branding = site?.branding;
  if (!branding) return false;
  if (key === 'powered_by') return branding.hide_powered_by === true;
  return false;
};

/**
 * Whether the per-generation "View Code" affordance (Nexior ApiCodeButton)
 * should render. ``branding.hide_api_code`` is a tri-state:
 *   - ``true``  → force-hidden (any site).
 *   - ``false`` → force-shown  (explicit site-config opt-in, e.g. a subsite).
 *   - unset     → default: shown on first-party official hosts, hidden on
 *     white-label subsites/tenants so they don't expose api.acedata.cloud.
 * ``official`` is injected so callers (and tests) stay independent of the
 * host-reading ``isOfficial()``.
 */
export const isApiCodeVisible = (site: ISite | null | undefined, official: boolean): boolean => {
  const flag = site?.branding?.hide_api_code;
  if (flag === true) return false;
  if (flag === false) return true;
  return official;
};

/**
 * Resolve the reseller's support URL: `branding.links.support` first, then
 * the legacy `metadata.support_url`. Returns '' when neither is set so
 * callers can hide the entry instead of leaking our own domain.
 */
export const getBrandSupportUrl = (site?: ISite | null): string => {
  return site?.branding?.links?.support || site?.metadata?.support_url || '';
};

/**
 * Ordered list of customer-service entries the site owner configured
 * (`branding.contacts`, PlatformBackend). Returns `[]` when unset / malformed
 * so callers can treat "no contacts" uniformly.
 */
export const getBrandContacts = (site?: ISite | null): ISiteContact[] => {
  const contacts = site?.branding?.contacts;
  return Array.isArray(contacts) ? contacts : [];
};

/**
 * True when the site owner filled in at least one contact entry.
 */
export const hasBrandContacts = (site?: ISite | null): boolean => {
  return getBrandContacts(site).length > 0;
};

// Site-wide markup ceiling, mirroring PlatformBackend
// `app/utils/site_pricing.py` (MARKUP_RATIO_MIN/MAX). 0 = sell at platform
// price; 5 = +500% (6x).
export const MARKUP_RATIO_MIN = 0;
export const MARKUP_RATIO_MAX = 5;

/**
 * White-label switch to hide every top-up / recharge entry. Reads
 * `site.metadata.disable_recharge` (PlatformBackend passes unknown
 * `metadata` keys through verbatim). Default — unset or not exactly
 * `true` — is `false`, i.e. recharge stays enabled.
 */
export const isRechargeDisabled = (site?: ISite | null): boolean => {
  return site?.metadata?.disable_recharge === true;
};

/**
 * Read the site-wide markup ratio from `site.metadata.pricing.markup_ratio`
 * defensively. Mirrors the backend `extract_markup_ratio`: any missing /
 * malformed / out-of-range value collapses to 0, values above the ceiling are
 * clamped, and only `applies_to === 'all'` (the v1 default) is honored.
 */
export const getSiteMarkupRatio = (site?: ISite | null): number => {
  const pricing = site?.metadata?.pricing;
  if (!pricing) return 0;
  if (pricing.applies_to !== undefined && pricing.applies_to !== 'all') return 0;
  const raw = pricing.markup_ratio;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  if (raw < MARKUP_RATIO_MIN) return 0;
  if (raw > MARKUP_RATIO_MAX) return MARKUP_RATIO_MAX;
  return raw;
};

/**
 * Use the backend's order-consistent per-service markup when available.
 * Individual-service applications fail closed when an older backend omits the
 * field; only global applications fall back because their order pricing uses
 * the site-wide default directly.
 */
export const getApplicationMarkupRatio = (
  application?: IApplication | null,
  site?: ISite | null
): number | undefined => {
  if (!application) return undefined;
  const raw = application?.effective_markup_ratio;
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    const hasService = !!(application.service_id || application.service?.id);
    return hasService || !site?.id ? undefined : getSiteMarkupRatio(site);
  }
  if (raw < MARKUP_RATIO_MIN) return undefined;
  if (raw > MARKUP_RATIO_MAX) return MARKUP_RATIO_MAX;
  return raw;
};

export const getApplicationCallerOrderDiscountRate = (application?: IApplication | null): number | undefined => {
  if (!application) return undefined;
  const raw = application?.effective_caller_order_discount_rate;
  if (raw === undefined || raw === null) return 0;
  if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 0 || raw > 1) return undefined;
  return raw;
};

/**
 * Apply a markup ratio to a price: `price * (1 + ratio)`. Mirrors the backend
 * `apply_markup` so the displayed price matches what the gateway charges at
 * order time. Non-finite / negative inputs are treated as 0 so callers can
 * pass raw package prices without pre-guarding.
 */
export const applyMarkup = (price?: number | null, ratio?: number | null): number => {
  const base = typeof price === 'number' && Number.isFinite(price) ? price : 0;
  let r = typeof ratio === 'number' && Number.isFinite(ratio) ? ratio : 0;
  if (r < 0) r = 0;
  return base * (1 + r);
};
