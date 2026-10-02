export const officialSiteHost = (host: string, canonical: string): string => {
  const prefix = host.endsWith(`.${canonical}`) ? host.slice(0, -canonical.length - 1) : '';
  return /^20\d{6}$/.test(prefix) ? canonical : host;
};

export const wechatRedirect = (href: string, canonical: string, now = new Date()): string | undefined => {
  const url = new URL(href);
  if (url.hostname !== canonical || url.pathname.startsWith('/auth/') || url.searchParams.has('code')) {
    return undefined;
  }
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  url.hostname = `${date}.${canonical}`;
  return url.toString();
};
