// URL-driven feature flags, backed by a 1-day sliding host-only cookie.
//
// Usage:
//   import { isFeatureEnabled, syncFeaturesFromUrl } from '@/utils/featureFlag';
//   syncFeaturesFromUrl(); // call once at app boot, before router runs
//   if (isFeatureEnabled('experimental-foo')) { ... }
//
// Visit any page with `?features=foo` to enable a flag. Multiple flags can
// be comma- or space-separated: `?features=foo,bar`. Prefix with `-` (or
// `!`) to disable a single flag: `?features=-foo`. Use `?features=none`
// (also `off`, `clear`) to drop the cookie entirely. `?features=all` (or
// `*`) flips every flag the FE consults; combine with `-foo` to opt out
// of a single one.
//
// Why a cookie:
//
// - The cookie has a 1-day **sliding** expiry — every URL sync rewrites
//   it with `expires: now + 1d`, so an actively-testing user stays on
//   while an idle one self-clears after 24h. Stale flags can't survive
//   a deploy.
// - Host-only (no `domain=`) so the cookie does not collide with the
//   sibling PlatformFrontend / AuthFrontend cookies of the same name.

import { getCookie, removeCookie, setCookie } from 'typescript-cookie';

const COOKIE_NAME = 'FEATURES';
const ALL_TOKEN = '__all__';
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

export function isFeatureEnabled(name: string): boolean {
  const set = cachedFeatures ?? readStoredFeatures();
  if (set.has(ALL_TOKEN)) return true;
  return set.has(name.toLowerCase());
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
  add.forEach((f) => features.add(f));
  remove.forEach((f) => features.delete(f));
  if (remove.size > 0) features.delete(ALL_TOKEN);

  writeStoredFeatures(features);
  cachedFeatures = features;
  return features;
}
