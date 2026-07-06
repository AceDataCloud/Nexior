import { ISite } from '@/models';
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

// Site-wide markup ceiling, mirroring PlatformBackend
// `app/utils/site_pricing.py` (MARKUP_RATIO_MIN/MAX). 0 = sell at platform
// price; 5 = +500% (6x).
export const MARKUP_RATIO_MIN = 0;
export const MARKUP_RATIO_MAX = 5;

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
