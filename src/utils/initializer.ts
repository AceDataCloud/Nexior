import { getCookie, setCookie } from 'typescript-cookie';
import config from '@/config';
import favicon from '@/assets/images/favicon.ico';
import { getLocale } from '@/i18n';

export const getDomain = () => {
  const host = window.location.hostname;
  // process test env and prod env, for example:
  // hub.acedata.cloud -> .acedata.cloud
  // hub.test.acedata.cloud -> .acedata.cloud
  const domain = host.replace(/^\S+?\.(test\.|local\.)?/, '.');
  console.log('cookies domain', domain);
  return domain;
};

export const initializeCookies = async () => {
  // parse the query string and set to cookies
  const query = new URLSearchParams(window.location.search);

  // set the inviter id to cookies
  const inviterId = query.get('inviter_id');
  if (inviterId) {
    // set the cookie to expire in 7 days
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);
    console.log('set INVITER_ID to cookies', inviterId);
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
    console.log('set THEME to cookies', isDark ? 'dark' : 'light');
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
    console.log('set LOCALE to cookies', locale);
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
  // set the title from config.global.title
  const title = config.global.title;
  // find the title element or insert a new one
  let titleElement = document.querySelector('title');
  if (!titleElement) {
    titleElement = document.createElement('title');
    document.head.appendChild(titleElement);
  }
  titleElement.innerHTML = title;
};

/**
 * Initialize favicon.
 */
export const initializeFavicon = async () => {
  // by default use favicon which imported
  // if faviconUrl is set in config, use it instead
  const favIconUrl = config.global.faviconUrl;
  let faviconElement = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (!faviconElement) {
    faviconElement = document.createElement('link');
    faviconElement.rel = 'icon';
    document.head.appendChild(faviconElement);
  }
  faviconElement.href = favIconUrl || favicon;
};
