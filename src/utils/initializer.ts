import { setCookie } from 'typescript-cookie';

export const initializeCookies = () => {
  // parse the query string and set to cookies
  const query = new URLSearchParams(window.location.search);
  const inviterId = query.get('inviter_id');
  const expiration = new Date();
  expiration.setDate(expiration.getDate() + 7);
  console.log('set INVITER_ID to cookies', inviterId);
  setCookie('INVITER_ID', inviterId, {
    expires: expiration
  });
};
