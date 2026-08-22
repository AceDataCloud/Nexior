import { authOperator } from '@/operators/auth';
import { getBaseUrlAuth } from './baseUrl';
import { withCurrentSite } from './crossSiteUser';

export function isAuthFrontendUrl(value: string): boolean {
  try {
    return new URL(value).origin === new URL(getBaseUrlAuth()).origin;
  } catch {
    return false;
  }
}

export function buildAuthLoginUrl(targetUrl: string): string {
  const target = new URL(withCurrentSite(targetUrl));
  const redirect = `${target.pathname}${target.search}${target.hash}`;
  const login = new URL('/auth/login/', getBaseUrlAuth());
  login.searchParams.set('redirect', redirect);
  return withCurrentSite(login.toString());
}

export async function withAuthFrontendSession(targetUrl: string): Promise<string> {
  if (!isAuthFrontendUrl(targetUrl)) return targetUrl;

  const fallbackUrl = buildAuthLoginUrl(targetUrl);
  try {
    const { data } = await authOperator.getCode();
    const login = new URL(fallbackUrl);
    login.searchParams.set('code', data.code);
    return login.toString();
  } catch (error) {
    console.warn('failed to hand off session to AuthFrontend', error);
    return fallbackUrl;
  }
}
