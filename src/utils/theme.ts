/**
 * Theme & primary-color runtime helpers.
 *
 * The app has two independent visual axes:
 *
 *  1. light / dark — toggled via the `dark` class on <html>, see `applyTheme`.
 *  2. accent (a.k.a. primary / brand) colour — a single hex picked per-site
 *     by site admins. The default is the historical Ace Data Cloud teal
 *     (#277186) compiled into element-plus via _element.scss; `applyAccentColor`
 *     overrides it at runtime by writing a small set of CSS variables.
 *
 * Why CSS vars (not Sass / Tailwind regeneration)? Because the colour is
 * configured per-site at runtime from `Site.theme.primary_color`, so we
 * can't pre-compile it. The Sass `@forward` in _element.scss still ships the
 * teal as the default and is what unstyled / not-yet-initialised renders
 * pick up; once `initializeTheme` runs, the runtime vars override Element
 * Plus's compiled-in primaries via CSS specificity.
 */

export function applyTheme(theme: string) {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  // Update color-scheme so native UI elements (scrollbars, inputs, etc.) match
  document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

/** Default brand colour (Ace Data Cloud teal). Kept in sync with
 *  `_element.scss` $colors.primary.base and `_common.scss` :root defaults. */
export const DEFAULT_PRIMARY_COLOR = '#277186';

/** CSS variables this module manages. Anything in `_common.scss` / a `.vue`
 *  scoped style that wants to vary with the accent colour must consume one
 *  of these (typically via `rgba(var(--app-brand-rgb), <alpha>)`). */
const PRIMARY_VAR_KEYS = [
  '--el-color-primary',
  '--el-color-primary-light-3',
  '--el-color-primary-light-5',
  '--el-color-primary-light-7',
  '--el-color-primary-light-8',
  '--el-color-primary-light-9',
  '--el-color-primary-dark-2',
  '--app-brand-rgb',
  '--app-brand-hex',
  '--app-brand-hex-dark-2',
  '--app-brand-hex-light-7',
  '--app-gradient-brand',
  '--app-gradient-brand-hover'
] as const;

type RGB = { r: number; g: number; b: number };

const HEX3_RE = /^#?([0-9a-f])([0-9a-f])([0-9a-f])$/i;
const HEX6_RE = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

export function parseHex(hex: string): RGB | null {
  if (!hex || typeof hex !== 'string') return null;
  const trimmed = hex.trim();
  const m6 = trimmed.match(HEX6_RE);
  if (m6) {
    return { r: parseInt(m6[1], 16), g: parseInt(m6[2], 16), b: parseInt(m6[3], 16) };
  }
  const m3 = trimmed.match(HEX3_RE);
  if (m3) {
    return {
      r: parseInt(m3[1] + m3[1], 16),
      g: parseInt(m3[2] + m3[2], 16),
      b: parseInt(m3[3] + m3[3], 16)
    };
  }
  return null;
}

function rgbToHex({ r, g, b }: RGB): string {
  const h = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  return '#' + h(r) + h(g) + h(b);
}

/** Element Plus's own algorithm for `primary-light-N` / `primary-dark-N`:
 *  mix the base colour with white (for `light`) or black (for `dark`) by
 *  `level * 10%`. Matches their Sass `mix($color, $white, $weight)` defaults. */
function mix(base: RGB, mixin: RGB, weight: number): RGB {
  return {
    r: base.r * (1 - weight) + mixin.r * weight,
    g: base.g * (1 - weight) + mixin.g * weight,
    b: base.b * (1 - weight) + mixin.b * weight
  };
}

const WHITE: RGB = { r: 255, g: 255, b: 255 };
const BLACK: RGB = { r: 0, g: 0, b: 0 };

/**
 * Apply an accent colour at runtime. Pass `null` / `undefined` /
 * empty / invalid hex to **revert** to the compiled-in default (teal).
 *
 * Safe to call multiple times — each call fully replaces the previous set.
 */
export function applyAccentColor(hex?: string | null): void {
  const root = document.documentElement.style;
  const rgb = parseHex(hex || '');
  if (!rgb) {
    // No site preference (or invalid) — drop all overrides so the Sass
    // defaults from `_element.scss` + `_common.scss :root` shine through.
    for (const key of PRIMARY_VAR_KEYS) root.removeProperty(key);
    return;
  }

  // Light derivatives — mix with white at 30/50/70/80/90 %.
  const l3 = mix(rgb, WHITE, 0.3);
  const l5 = mix(rgb, WHITE, 0.5);
  const l7 = mix(rgb, WHITE, 0.7);
  const l8 = mix(rgb, WHITE, 0.8);
  const l9 = mix(rgb, WHITE, 0.9);
  // Dark derivative — mix with black at 20 %.
  const d2 = mix(rgb, BLACK, 0.2);

  root.setProperty('--el-color-primary', rgbToHex(rgb));
  root.setProperty('--el-color-primary-light-3', rgbToHex(l3));
  root.setProperty('--el-color-primary-light-5', rgbToHex(l5));
  root.setProperty('--el-color-primary-light-7', rgbToHex(l7));
  root.setProperty('--el-color-primary-light-8', rgbToHex(l8));
  root.setProperty('--el-color-primary-light-9', rgbToHex(l9));
  root.setProperty('--el-color-primary-dark-2', rgbToHex(d2));

  // Channel-only form for `rgba(var(--app-brand-rgb), 0.x)` consumers in
  // _common.scss + various pages' scoped styles.
  root.setProperty('--app-brand-rgb', `${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}`);
  root.setProperty('--app-brand-hex', rgbToHex(rgb));
  root.setProperty('--app-brand-hex-dark-2', rgbToHex(d2));
  root.setProperty('--app-brand-hex-light-7', rgbToHex(l7));

  // Brand gradients — keep the same 3-stop shape, just derived from the
  // picked colour. `mix-with-white-50%` for the third stop matches the
  // historical "#689caa" relationship to #277186.
  const grad = `linear-gradient(135deg, ${rgbToHex(rgb)} 0%, ${rgbToHex(d2)} 50%, ${rgbToHex(l5)} 100%)`;
  const gradHover = `linear-gradient(135deg, ${rgbToHex(d2)} 0%, ${rgbToHex(mix(rgb, BLACK, 0.35))} 50%, ${rgbToHex(d2)} 100%)`;
  root.setProperty('--app-gradient-brand', grad);
  root.setProperty('--app-gradient-brand-hover', gradHover);
}
