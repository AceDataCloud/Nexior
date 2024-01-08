import { setCookie } from 'typescript-cookie';
import config from '@/config';
import favicon from '@/assets/images/favicon.ico';

/**
 * Initialize cookies.
 */
export const initializeCookies = () => {
  // parse the query string and set to cookies
  const query = new URLSearchParams(window.location.search);
  const inviterId = query.get('inviter_id');
  if (inviterId) {
    // set the cookie to expire in 7 days
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 7);
    console.log('set INVITER_ID to cookies', inviterId);
    setCookie('INVITER_ID', inviterId, {
      expires: expiration,
      path: '/'
    });
  }
};

/**
 * Initialize title.
 */
export const initializeTitle = () => {
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
export const initializeFavicon = () => {
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
