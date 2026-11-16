/** Keep authentication returns inside the app, without replaying a connector install deep link. */
export function authReturnPath(target: string | undefined, reauthenticate = false): string {
  if (!target?.startsWith('/') || target.startsWith('//') || /[\\\u0000-\u0020]/.test(target)) return '/';
  try {
    const url = new URL(target, 'https://nexior.invalid');
    if (url.origin !== 'https://nexior.invalid') return '/';
    if (reauthenticate && url.pathname.toLowerCase().replace(/\/+$/, '') === '/console/connectors') {
      url.searchParams.delete('connect');
    }
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return '/';
  }
}
