import { getCookie, setCookie } from 'typescript-cookie';
import favicon from '@/assets/images/favicon.ico';
import { applyTheme } from './theme';
import store from '@/store';
import { IToken } from '@/models';
import { BASE_HOST_HUB, LOCALE_CURRENCY_MAPPING } from '@/constants';
import { isOfficial, isSubOfficial, isWechatBrowser } from './is';
import { getLocale } from '@/i18n';

// Common second-level public suffixes that need three-segment treatment, e.g.
// `foo.co.uk` → registrable domain is `foo.co.uk`, not `co.uk`. The full
// Public Suffix List is ~150 KB (~9.7k entries) and used to be pulled in via
// `psl` purely to compute the cookie domain — but for AceDataCloud's cookie
// scoping (LOCALE / THEME / INVITER_ID across our own subdomains) only the
// handful of multi-label TLDs below matter in practice. Anything else falls
// back to a "last two labels" rule, which is what `psl` would also return for
// any single-label TLD (`acedata.cloud`, `example.com`, …).
const MULTI_LABEL_PUBLIC_SUFFIXES = new Set<string>([
  'co.uk',
  'org.uk',
  'gov.uk',
  'ac.uk',
  'me.uk',
  'ltd.uk',
  'plc.uk',
  'co.jp',
  'or.jp',
  'ne.jp',
  'ac.jp',
  'go.jp',
  'ad.jp',
  'ed.jp',
  'gr.jp',
  'lg.jp',
  'co.kr',
  'or.kr',
  'ne.kr',
  'go.kr',
  're.kr',
  'pe.kr',
  'es.kr',
  'sc.kr',
  'hs.kr',
  'ms.kr',
  'co.in',
  'org.in',
  'net.in',
  'firm.in',
  'gen.in',
  'ind.in',
  'ac.in',
  'edu.in',
  'res.in',
  'gov.in',
  'co.id',
  'or.id',
  'ac.id',
  'web.id',
  'sch.id',
  'go.id',
  'mil.id',
  'net.id',
  'biz.id',
  'co.za',
  'org.za',
  'net.za',
  'web.za',
  'gov.za',
  'ac.za',
  'co.nz',
  'org.nz',
  'net.nz',
  'ac.nz',
  'school.nz',
  'govt.nz',
  'co.il',
  'org.il',
  'net.il',
  'ac.il',
  'gov.il',
  'muni.il',
  'idf.il',
  'co.th',
  'or.th',
  'ac.th',
  'go.th',
  'in.th',
  'mi.th',
  'net.th',
  'com.cn',
  'net.cn',
  'org.cn',
  'gov.cn',
  'edu.cn',
  'ac.cn',
  'mil.cn',
  'com.au',
  'net.au',
  'org.au',
  'edu.au',
  'gov.au',
  'asn.au',
  'id.au',
  'com.br',
  'net.br',
  'org.br',
  'gov.br',
  'edu.br',
  'com.mx',
  'org.mx',
  'gob.mx',
  'edu.mx',
  'com.ar',
  'org.ar',
  'gob.ar',
  'edu.ar',
  'net.ar',
  'com.tr',
  'net.tr',
  'org.tr',
  'edu.tr',
  'gov.tr',
  'gen.tr',
  'biz.tr',
  'com.tw',
  'org.tw',
  'net.tw',
  'edu.tw',
  'gov.tw',
  'idv.tw',
  'mil.tw',
  'game.tw',
  'com.hk',
  'org.hk',
  'net.hk',
  'edu.hk',
  'gov.hk',
  'idv.hk',
  'com.sg',
  'org.sg',
  'net.sg',
  'edu.sg',
  'gov.sg',
  'per.sg',
  'com.my',
  'org.my',
  'net.my',
  'gov.my',
  'edu.my',
  'mil.my',
  'com.vn',
  'net.vn',
  'org.vn',
  'edu.vn',
  'gov.vn',
  'biz.vn',
  'pro.vn',
  'name.vn',
  'com.ph',
  'net.ph',
  'org.ph',
  'gov.ph',
  'edu.ph',
  'com.pk',
  'net.pk',
  'org.pk',
  'edu.pk',
  'gov.pk',
  'com.ru',
  'net.ru',
  'org.ru',
  'pp.ru',
  'msk.ru',
  'spb.ru',
  'com.ua',
  'net.ua',
  'org.ua',
  'gov.ua',
  'edu.ua',
  'kiev.ua',
  'com.ng',
  'net.ng',
  'org.ng',
  'gov.ng',
  'edu.ng',
  'co.ke',
  'or.ke',
  'ne.ke',
  'go.ke',
  'ac.ke',
  'sc.ke',
  'co.tz',
  'or.tz',
  'ne.tz',
  'go.tz',
  'ac.tz',
  'sc.tz',
  'co.ug',
  'or.ug',
  'ne.ug',
  'go.ug',
  'ac.ug',
  'sc.ug'
]);

const isIpLike = (host: string): boolean => /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || /^\[[0-9a-f:]+\]$/i.test(host);

/**
 * Compute the cookie-scope domain for the given host (defaults to current page).
 *
 * - Returns `host` unchanged for IP literals, `localhost`, single-label hosts,
 *   or hosts that already equal the registrable domain.
 * - Otherwise returns the registrable domain prefixed with `.` so cookies are
 *   shared across subdomains (e.g. `auth.acedata.cloud` → `.acedata.cloud`).
 *
 * Replaces a 150 KB `psl` dependency with a small lookup table covering the
 * multi-label public suffixes we actually care about for AceDataCloud cookies.
 */
export const getDomain = (host: string = window.location.hostname): string => {
  if (!host || host === 'localhost' || isIpLike(host)) {
    return host;
  }
  const labels = host.split('.');
  if (labels.length < 2) {
    return host;
  }
  let registrable: string;
  if (labels.length >= 3 && MULTI_LABEL_PUBLIC_SUFFIXES.has(labels.slice(-2).join('.'))) {
    registrable = labels.slice(-3).join('.');
  } else {
    registrable = labels.slice(-2).join('.');
  }
  if (registrable === host) {
    return host;
  }
  return '.' + registrable;
};

// @ts-ignore
window.getDomain = getDomain;

export const initializeCookies = async () => {
  // parse the query string and set to cookies
  const query = new URLSearchParams(window.location.search);

  // set the inviter id to cookies
  const inviterId = query.get('inviter_id');
  if (inviterId) {
    // set the cookie to expire in 7 days
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);
    console.debug('set INVITER_ID to cookies', inviterId);
    setCookie('INVITER_ID', inviterId, {
      expires: expiration,
      path: '/',
      domain: getDomain()
    });
  }

  // set the theme to cookies
  const theme = query.get('theme');
  if (theme) {
    console.log('set THEME to cookies', theme);
    setCookie('THEME', theme, {
      path: '/',
      domain: getDomain()
    });
  } else if (!getCookie('THEME')) {
    console.debug('set THEME to cookies', 'dark');
    setCookie('THEME', 'dark', {
      path: '/',
      domain: getDomain()
    });
  }

  // set the locale to cookies
  const lang = query.get('lang');
  let locale = undefined;
  if (lang) {
    locale = getLocale(lang);
  } else if (!getCookie('LOCALE')) {
    locale = getLocale();
  }
  if (locale) {
    console.debug('set LOCALE to cookies', locale);
    setCookie('LOCALE', locale, {
      path: '/',
      domain: getDomain()
    });
  }
};

/**
 * Initialize title.
 */
export const initializeTitle = async () => {
  // set the title from store.state.site?.title
  const title = store.state.site?.title || '';
  // find the title element or insert a new one
  let titleElement = document.querySelector('title');
  if (!titleElement) {
    titleElement = document.createElement('title');
    document.head.appendChild(titleElement);
  }
  titleElement.innerHTML = title;
};

/**
 * Initialize description.
 */
export const initializeDescription = async () => {
  // set the title from store.state.site?.description
  const description = store.state.site?.description || '';
  let metaTag = document.querySelector('meta[name="description"]');
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'description');
    document.head.appendChild(metaTag);
  }
  metaTag.setAttribute('content', description);
};

/**
 * Initialize keywords in meta
 */
export const initializeKeywords = async () => {
  // set the title from store.state.site?.keywords
  const keywords = store.state.site?.keywords?.join(',') || '';
  let metaTag = document.querySelector('meta[name="keywords"]');
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute('name', 'keywords');
    document.head.appendChild(metaTag);
  }
  metaTag.setAttribute('content', keywords);
};

/**
 * Initialize favicon.
 */
export const initializeFavicon = async () => {
  // by default use favicon which imported
  // if faviconUrl is set, use it instead
  const favIconUrl = store.state.site?.favicon || '';
  let faviconElement = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!faviconElement) {
    faviconElement = document.createElement('link');
    faviconElement.rel = 'icon';
    document.head.appendChild(faviconElement);
  }
  faviconElement.href = favIconUrl || favicon;
};

/**
 * Need to initialize site before render contents
 */
export const initializeSite = async () => {
  await store.dispatch('getSite');
  // after getSite, the site should have been set
  const site = store.state.site;
  console.debug('site', site);
  // if site is not set, try to initialize site
  if (!site?.origin) {
    await store.dispatch('initializeSite');
  }
};

export const initializeConfig = async () => {
  await store.dispatch('fetchConfig');
};

/**
 * Initialize token by code
 */
export const initializeToken = async () => {
  const query = new URLSearchParams(window.location.search);
  const code = query.get('code');
  console.debug('get code', code);
  // avoid exchanging the same code multiple times (e.g., page re-render)
  const usedCodeKey = 'oauth_code_used';
  if (!code) return;
  if (store.state.token?.access) {
    console.debug('access token already exists, skip code exchange');
    return;
  }
  const cached = sessionStorage.getItem(usedCodeKey);
  if (cached === code) {
    console.debug('code already exchanged in this session, skip');
    return;
  }
  console.debug('start get token by code', code);
  try {
    const token = await store.dispatch('getToken', code);
    sessionStorage.setItem(usedCodeKey, code);
    // strip code from URL to avoid re-trigger on refresh
    const url = new URL(window.location.href);
    url.searchParams.delete('code');
    window.history.replaceState({}, document.title, url.toString());
    console.debug('success get token', token);
  } catch (err) {
    sessionStorage.removeItem(usedCodeKey);
    throw err;
  }
};

/**
 * Initialize theme
 */
export const initializeTheme = async () => {
  const theme = getCookie('THEME') || 'dark';
  console.debug('initialize theme', theme);
  applyTheme(theme);
};

/**
 * Initialize user by token
 */
export const initializeUser = async () => {
  const token = store.state.token as IToken;
  if (!token?.access) {
    console.debug('no access token, skip get user');
    return;
  }
  console.debug('start to get user');
  const user = await store.dispatch('getUser');
  console.debug('get user', user);
};

export const initializeCurrency = async () => {
  const locale = getCookie('LOCALE');
  console.debug('initialize currency', locale);
  const mapping = LOCALE_CURRENCY_MAPPING;
  let currency = 'usd';
  if (locale && mapping[locale]) {
    currency = mapping[locale];
  }
  console.debug('set currency', currency);
  await store.dispatch('setCurrency', currency);
};

export const initializeExchangeRate = async () => {
  const locale = getCookie('LOCALE');
  const mapping = LOCALE_CURRENCY_MAPPING;
  if (!locale || !mapping[locale]) {
    return;
  }
  const target = mapping[locale];
  const source = 'usd';
  const payload = { source, target };
  console.debug('initialize exchange rate', payload);
  await store.dispatch('getExchangeRate', payload);
};

export const initializeRedirect = async (): Promise<boolean> => {
  if (isOfficial() && !isSubOfficial() && isWechatBrowser()) {
    console.debug('redirect to sub domain with prefix');
    // redirect from hub.acedata.cloud to dynamic date like 20240802.hub.acedata.cloud
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const newUrl = window.location.href.replace(BASE_HOST_HUB, `${date}.${BASE_HOST_HUB}`);
    console.debug('redirect to', newUrl);
    window.location.href = newUrl;
    return true;
  }
  return false;
};

export const initializeFingerprint = async () => {
  await store.dispatch('getFingerprint');
};
