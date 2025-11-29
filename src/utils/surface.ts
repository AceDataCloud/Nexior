export function isMobile(): boolean {
  const ua = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod|android|windows phone/i.test(ua);
}
