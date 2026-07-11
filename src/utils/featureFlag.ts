// URL-driven feature flags, backed by a 1-day sliding host-only cookie.
//
// Usage:
//   import { isFeatureEnabled, syncFeaturesFromUrl } from '@/utils/featureFlag';
//   syncFeaturesFromUrl(); // call once at app boot, before router runs
//   if (isFeatureEnabled('experimental-foo')) { ... }
//
// Visit any page with `?features=foo` to enable a flag. Multiple flags can
// be comma- or space-separated: `?features=foo,bar`. Prefix with `-` (or
// `!`) to disable a single flag: `?features=-foo` — this records an explicit
// force-OFF that persists and wins over both `all` and the server value. Use
// `?features=none` (also `off`, `clear`) to drop every override (falling back
// to the server default). `?features=all` (or `*`) flips every flag the FE
// consults; combine with `-foo` to opt out of a single one.
//
// Why a cookie:
//
// - The cookie has a 1-day **sliding** expiry — every URL sync rewrites
//   it with `expires: now + 1d`, so an actively-testing user stays on
//   while an idle one self-clears after 24h. Stale flags can't survive
//   a deploy.
// - Host-only (no `domain=`) so the cookie does not collide with the
//   sibling PlatformFrontend / AuthFrontend cookies of the same name.
//
// Server-driven flags: besides the URL/cookie opt-in (dev / beta-tester
// escape hatch), a flag can also be turned on for everyone from the
// backend via `GET /config`'s `features` bag. Resolution order: explicit
// URL/cookie force-OFF (`-foo`) → `all`/opt-in → server value → off. The
// force-OFF wins so a tester can still disable a broken server flag.

import { getCookie, removeCookie, setCookie } from 'typescript-cookie';
// NOTE: `@/store` imports this module (via common/actions.ts), so this is a
// cycle. It is safe ONLY because `store` is dereferenced lazily inside
// `readServerFlag` at call time — never at module top level. Keep it that way.
import store from '@/store';
import { getLoginMethodPreference } from './loginMethod';

const COOKIE_NAME = 'FEATURES';
const ALL_TOKEN = '__all__';
// A `!<flag>` token in the set is an explicit force-OFF that wins over both
// the `all` token and the server-driven value (so `?features=-foo` can still
// disable a flag the backend turned on for everyone).
const OFF_PREFIX = '!';
const EXPIRY_DAYS = 1;

let cachedFeatures: Set<string> | null = null;

function isHttps(): boolean {
  if (typeof window === 'undefined') return true;
  return window.location.protocol === 'https:';
}

function readStoredFeatures(): Set<string> {
  if (typeof document === 'undefined') return new Set();
  try {
    const raw = getCookie(COOKIE_NAME);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function writeStoredFeatures(features: Set<string>): void {
  if (typeof document === 'undefined') return;
  try {
    if (features.size === 0) {
      removeCookie(COOKIE_NAME, { path: '/' });
      return;
    }
    setCookie(COOKIE_NAME, JSON.stringify(Array.from(features)), {
      expires: EXPIRY_DAYS,
      path: '/',
      sameSite: 'lax',
      secure: isHttps()
    });
  } catch {
    // private mode / quota — silently ignore
  }
}

function parseTokens(raw: string): {
  clear: boolean;
  all: boolean;
  add: Set<string>;
  remove: Set<string>;
} {
  const add = new Set<string>();
  const remove = new Set<string>();
  let clear = false;
  let all = false;
  for (const piece of raw.split(/[\s,]+/)) {
    const t = piece.trim().toLowerCase();
    if (!t) continue;
    if (t === 'clear' || t === 'none' || t === 'off') {
      clear = true;
      continue;
    }
    if (t === 'all' || t === '*') {
      all = true;
      continue;
    }
    if (t.startsWith('-') || t.startsWith('!')) {
      remove.add(t.slice(1));
      continue;
    }
    add.add(t);
  }
  return { clear, all, add, remove };
}

// Read the server-side value for `name` from the Vuex-stored `/config`
// response (`state.config.features`). Returns `undefined` when the backend
// hasn't shipped a value for this flag so the caller falls back to off.
function readServerFlag(name: string): boolean | undefined {
  let features: Record<string, unknown> | undefined;
  try {
    features = (store.getters.config as { features?: Record<string, unknown> } | undefined)?.features;
  } catch {
    return undefined;
  }
  if (!features) return undefined;
  let v = features[name];
  if (v === undefined) v = features[name.toLowerCase()];
  if (v === undefined) return undefined;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'string') return v.length > 0;
  return Boolean(v);
}

export function isFeatureEnabled(name: string): boolean {
  const set = cachedFeatures ?? readStoredFeatures();
  const key = name.toLowerCase();
  if (set.has(OFF_PREFIX + key)) return false;
  if (set.has(ALL_TOKEN)) return true;
  if (set.has(key)) return true;
  return readServerFlag(name) === true;
}

export function isAuthIframeFeatureEnabled(): boolean {
  // An explicit user choice in Settings wins over the URL / server feature flag.
  const preference = getLoginMethodPreference();
  if (preference === 'iframe') return true;
  if (preference === 'redirect') return false;
  // OR of two flags, and the server sends both — so to force it OFF you must
  // disable both tokens: `?features=-auth-iframe,-iframe`.
  return isFeatureEnabled('auth-iframe') || isFeatureEnabled('iframe');
}

export function syncFeaturesFromUrl(): Set<string> {
  if (typeof window === 'undefined') {
    cachedFeatures = new Set();
    return cachedFeatures;
  }

  const features = readStoredFeatures();
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('features');

  if (raw === null) {
    cachedFeatures = features;
    return features;
  }

  const { clear, all, add, remove } = parseTokens(raw);
  if (clear) features.clear();
  if (all) features.add(ALL_TOKEN);
  // Opt-in clears any prior force-OFF; opt-out records an explicit force-OFF
  // (kept as `!flag`) so it overrides `all` and the server-driven value.
  add.forEach((f) => {
    features.delete(OFF_PREFIX + f);
    features.add(f);
  });
  remove.forEach((f) => {
    features.delete(f);
    features.add(OFF_PREFIX + f);
  });

  writeStoredFeatures(features);
  cachedFeatures = features;
  return features;
}
