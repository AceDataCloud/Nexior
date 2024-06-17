import { ISite } from '@/models';
import { v4 as uuid } from 'uuid';

export const getSiteOrigin = (site?: ISite) => {
  if (site?.origin) {
    return site?.origin;
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
