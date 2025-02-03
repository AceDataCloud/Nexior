import { getCookie, setCookie } from 'typescript-cookie';
import favicon from '@/assets/images/favicon.ico';
import { getLocale } from '@/i18n';
import store from '@/store';
import { IToken } from '@/models';
import psl from 'psl';
import { BASE_HOST_HUB, LOCALE_CURRENCY_MAPPING } from '@/constants';
import { isOfficial, isSubOfficial, isWechatBrowser } from './is';

export const getDomain = (host: string = window.location.hostname) => {
  const parsed = psl.parse(host);
  if (parsed.error) {
    return host;
  }
  if (!parsed.listed) {
    return host;
  }
  if (parsed.domain === host) {
    return host;
  }
  return '.' + parsed.domain;
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
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.debug('set THEME to cookies', isDark ? 'dark' : 'light');
    setCookie('THEME', isDark ? 'dark' : 'light', {
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

/**
 * Initialize token by code
 */
export const initializeToken = async () => {
  const query = new URLSearchParams(window.location.search);
  const code = query.get('code');
  console.debug('get code', code);
  if (code) {
    console.debug('start get token by code', code);
    const token = await store.dispatch('getToken', code);
    console.debug('success get token', token);
  }
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

export const initializeRedirect = async () => {
  if (isOfficial() && !isSubOfficial() && isWechatBrowser()) {
    console.debug('redirect to sub domain with prefix');
    // redirect from hub.acedata.cloud to dynamic date like 20240802.hub.acedata.cloud
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const newUrl = window.location.href.replace(BASE_HOST_HUB, `${date}.${BASE_HOST_HUB}`);
    console.debug('redirect to', newUrl);
    window.location.href = newUrl;
  }
};

export const initializeFingerprint = async () => {
  await store.dispatch('getFingerprint');
};
