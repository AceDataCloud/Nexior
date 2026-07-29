/**
 * Surface gating for skill installs.
 *
 * A catalog skill can declare `surfaces:` in its frontmatter (e.g. a
 * macOS-only automation). This decides whether the current runtime
 * satisfies that restriction, reusing Nexior's own shell detection
 * (`@/utils/surface`) rather than re-sniffing the userAgent.
 */

import { getDesktopOS, isAndroid, isDesktop, isIOS, isWeb } from '../surface';

/** Surface tokens the current runtime satisfies. */
export function currentSurfaceTokens(): Set<string> {
  const tokens = new Set<string>();
  if (isDesktop()) tokens.add('desktop');
  if (isIOS()) tokens.add('ios');
  if (isAndroid()) tokens.add('android');
  if (isWeb()) tokens.add('web');

  // OS: the desktop bridge is authoritative when we're in the Electron
  // shell, but a plain browser tab has no bridge — fall back to the UA so a
  // mac-only skill isn't reported unavailable to a Mac user on the web.
  const os = getDesktopOS();
  if (os === 'mac') tokens.add('mac');
  else if (os === 'windows') tokens.add('windows');
  else if (typeof navigator !== 'undefined') {
    const ua = navigator.userAgent || '';
    const uaPlatform = (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform;
    // iPadOS ≥13 reports a "Macintosh" UA; touch points disambiguate it.
    const ipadOS = /macintosh/i.test(ua) && (navigator.maxTouchPoints || 0) > 1;
    if (!isIOS() && !ipadOS && (uaPlatform === 'macOS' || /mac os x|macintosh/i.test(ua))) tokens.add('mac');
    if (uaPlatform === 'Windows' || /windows nt/i.test(ua)) tokens.add('windows');
  }
  return tokens;
}

/** Tokens the gate understands. Keep in sync with the
 *  `skill.directory.surface.*` i18n labels. */
const KNOWN_SURFACES = new Set(['mac', 'windows', 'desktop', 'web', 'ios', 'android']);

/**
 * Whether a skill restricted to `surfaces` can be installed here. An empty
 * or absent restriction is always installable. Unrecognized tokens are
 * ignored, so an all-unknown restriction (a typo, or a surface we don't
 * model yet) fails open rather than blocking everyone.
 */
export function isSurfaceSupported(surfaces: string[]): boolean {
  const known = surfaces.filter((s) => KNOWN_SURFACES.has(s));
  if (!known.length) return true;
  const current = currentSurfaceTokens();
  return known.some((s) => current.has(s));
}
