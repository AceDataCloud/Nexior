/**
 * Detection helpers for WeChat-related UI branching.
 *
 * Our merchant only has WeChat Pay Native (QR-code) enabled, so the
 * frontend never needs to switch the pay surface — backend always
 * issues a Native QR. These helpers exist purely so the WeChat-pay
 * dialog can pick the right layout (PC QR, long-press QR inside the
 * WeChat in-app browser, or "copy link" guide for mobile browsers
 * outside WeChat).
 */

/** True when the current page is running inside the WeChat in-app browser. */
export function isInWeChat(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /MicroMessenger/i.test(navigator.userAgent || '');
}

/** True when the current user-agent looks like a mobile browser. */
export function isMobileBrowser(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }
  return /(iPhone|iPad|iPod|Android|HarmonyOS|Mobile|Windows Phone|BlackBerry|Opera Mini)/i.test(
    navigator.userAgent || ''
  );
}
