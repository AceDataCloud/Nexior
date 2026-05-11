/**
 * Wallpaper runtime helper.
 *
 * Reads the per-site wallpaper config from `Site.metadata.background_*` and
 * applies / clears the CSS variables that `_common.scss` consumes via the
 * fixed `body::before` pseudo-element. Also writes a small sessionStorage
 * cache so `index.html`'s pre-paint script can paint the wallpaper BEFORE
 * Vue mounts — avoiding the "no-wallpaper flash, then wallpaper" FOUC.
 *
 * Storage location:
 *   `Site.metadata.background_image`   — CDN URL (string, or absent)
 *   `Site.metadata.background_blur`    — int px, 0..40, default 12
 *   `Site.metadata.background_opacity` — int %, 60..98, default 92
 *
 * Why `metadata` and not the new `Site.theme` field: PlatformBackend
 * `app/utils/site_theme.py` ships with a strict allow-list (`primary_color`
 * only) and 400-rejects any other key. `metadata` is the free-form JSON
 * bucket we already use for ad-hoc site config, so this lands in one PR
 * without needing a backend release.
 */

const STORAGE_KEY = 'nexior:wallpaper-cache';

/** Default Gaussian blur applied to the wallpaper when an image is set
 *  but `background_blur` is omitted. 0 = sharp; macOS-style frosted glass
 *  is ~12px. We default ON so a freshly-uploaded wallpaper is immediately
 *  readable; admins can dial blur down to 0 if they explicitly want a
 *  sharp image. */
export const BG_BLUR_DEFAULT = 12;
export const BG_BLUR_MIN = 0;
export const BG_BLUR_MAX = 40;

/** Surface opacity (percent) on top of the wallpaper. Bounded:
 *  - below 60: text on sidebars / cards becomes unreadable
 *  - above 98: wallpaper is fully hidden — the feature is invisible
 *  Default 92 keeps text easily readable while still showing the wallpaper
 *  through the sidebars/header. */
export const BG_OPACITY_DEFAULT = 92;
export const BG_OPACITY_MIN = 60;
export const BG_OPACITY_MAX = 98;

export interface WallpaperConfig {
  /** CDN URL of the wallpaper image. Empty / undefined means "no wallpaper". */
  image: string;
  /** Gaussian blur radius in px, clamped to [BG_BLUR_MIN, BG_BLUR_MAX]. */
  blur: number;
  /** Surface opacity in percent, clamped to [BG_OPACITY_MIN, BG_OPACITY_MAX]. */
  opacity: number;
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(Math.max(n, lo), hi);
}

/** Normalize whatever shape `site.metadata` happens to be (`null`, missing
 *  keys, accidental strings, etc.) into a clean `WallpaperConfig`. */
export function readWallpaperConfig(metadata: unknown): WallpaperConfig {
  const m = (metadata ?? {}) as Record<string, unknown>;
  const rawImage = typeof m.background_image === 'string' ? m.background_image.trim() : '';
  const rawBlur = typeof m.background_blur === 'number' ? m.background_blur : NaN;
  const rawOpacity = typeof m.background_opacity === 'number' ? m.background_opacity : NaN;
  return {
    image: rawImage,
    blur: Number.isFinite(rawBlur) ? clamp(rawBlur, BG_BLUR_MIN, BG_BLUR_MAX) : BG_BLUR_DEFAULT,
    opacity: Number.isFinite(rawOpacity) ? clamp(rawOpacity, BG_OPACITY_MIN, BG_OPACITY_MAX) : BG_OPACITY_DEFAULT
  };
}

/** CSS `url(...)` chokes on raw `)` / `"` / newlines. Real uploaded URLs from
 *  `/files/` are clean COS links, but a sufficiently determined admin could
 *  in principle paste anything via DevTools — escape defensively. */
function escapeForCssUrl(url: string): string {
  return url.replace(/["\\\n\r]/g, '');
}

/**
 * Apply (or clear) the wallpaper at runtime. Idempotent and safe to call
 * on every store change — each call fully replaces the previous state.
 *
 * Also persists the resolved config to sessionStorage so the next page
 * load's pre-paint script (in `index.html`) can paint the wallpaper
 * BEFORE Vue mounts, avoiding a flash of unstyled background.
 */
export function applyWallpaper(config: WallpaperConfig): void {
  const root = document.documentElement;
  if (config.image) {
    const safe = escapeForCssUrl(config.image);
    root.style.setProperty('--app-bg-image-url', `url("${safe}")`);
    root.style.setProperty('--app-bg-blur', `${config.blur}px`);
    root.style.setProperty('--app-surface-alpha', (config.opacity / 100).toString());
    root.classList.add('has-wallpaper');
    persistCache(config);
  } else {
    root.style.removeProperty('--app-bg-image-url');
    root.style.removeProperty('--app-bg-blur');
    root.style.removeProperty('--app-surface-alpha');
    root.classList.remove('has-wallpaper');
    clearCache();
  }
}

function persistCache(config: WallpaperConfig): void {
  try {
    // sessionStorage (not localStorage) on purpose: admin can rotate the
    // wallpaper, and we don't want stale per-browser caches winning over
    // the server-side truth across tabs. sessionStorage scopes to the tab
    // which gives us the "no FOUC on F5" win without leaking across
    // sessions.
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    /* private mode / disabled storage / quota — best-effort only */
  }
}

function clearCache(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
  }
}
