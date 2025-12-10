import { getCookie, setCookie } from 'typescript-cookie';
import favicon from '@/assets/images/favicon.ico';
import { applyTheme } from './theme';
import store from '@/store';
import { IToken } from '@/models';
import { parse } from 'psl';
import { BASE_HOST_HUB, LOCALE_CURRENCY_MAPPING } from '@/constants';
import { isOfficial, isSubOfficial, isWechatBrowser } from './is';
import { getLocale } from '@/i18n';

export const getDomain = (host: string = window.location.hostname) => {
  const parsed = parse(host);
  if ('error' in parsed && parsed.error) {
    return host;
  }
  if (!('listed' in parsed) || !parsed.listed) {
    return host;
  }
  if (parsed.domain === host) {
    return host;
  }
  return '.' + parsed.domain;
};

// @ts-ignore
window.getDomain = getDomain;

const ensureElement = <T extends Element>(selector: string, create: () => T) => {
  let element = document.querySelector(selector) as T | null;
  if (!element) {
    element = create();
    document.head.appendChild(element);
  }
  return element;
};

const updateMetaContent = (name: string, content: string) => {
  const metaTag = ensureElement<HTMLMetaElement>(`meta[name="${name}"]`, () => {
    const element = document.createElement('meta');
    element.setAttribute('name', name);
    return element;
  });
  metaTag.setAttribute('content', content);
};

export const initializeCookies = async () => {
  // parse the query string and set to cookies
  const query = new URLSearchParams(window.location.search);
  const domain = getDomain();

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
      domain
    });
  }

  // set the theme to cookies
  const theme = query.get('theme');
  if (theme) {
    console.log('set THEME to cookies', theme);
    setCookie('THEME', theme, {
      path: '/',
      domain
    });
  } else if (!getCookie('THEME')) {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.debug('set THEME to cookies', isDark ? 'dark' : 'light');
    setCookie('THEME', isDark ? 'dark' : 'light', {
      path: '/',
      domain
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
      domain
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
  const titleElement = ensureElement<HTMLTitleElement>('title', () =>
    document.createElement('title')
  );
  titleElement.textContent = title;
};

/**
 * Initialize description.
 */
export const initializeDescription = async () => {
  // set the title from store.state.site?.description
  const description = store.state.site?.description || '';
  updateMetaContent('description', description);
};

/**
 * Initialize keywords in meta
 */
export const initializeKeywords = async () => {
  // set the title from store.state.site?.keywords
  const keywords = store.state.site?.keywords?.join(',') || '';
  updateMetaContent('keywords', keywords);
};

/**
 * Initialize favicon.
 */
export const initializeFavicon = async () => {
  // by default use favicon which imported
  // if faviconUrl is set, use it instead
  const favIconUrl = store.state.site?.favicon || '';
  const faviconElement = ensureElement<HTMLLinkElement>('link[rel="icon"]', () => {
    const element = document.createElement('link');
    element.rel = 'icon';
    return element;
  });
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
