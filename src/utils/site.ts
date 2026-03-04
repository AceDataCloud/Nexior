import { ISite } from '@/models';
import { v4 as uuid } from 'uuid';
import { isOfficial } from './is';
import { BASE_URL_HUB } from '@/constants';

export const getSiteOrigin = (site?: ISite) => {
  if (site?.origin) {
    return site?.origin;
  }
  // On native platforms (Capacitor), window.location.host is "localhost"
  // which is not the real origin — use the official hub URL
  if (import.meta.env.VITE_SURFACE === 'android' || import.meta.env.VITE_SURFACE === 'ios') {
    return BASE_URL_HUB;
  }
  if (isOfficial()) {
    return BASE_URL_HUB;
  }
  const host = window.location.host;
  // if localhost, try to generate uuid
  if (host.includes('localhost')) {
    // generate uuid
    const randomId = uuid();
    return `http://localhost-${randomId}`;
  } else {
    return window.location.origin;
  }
};
