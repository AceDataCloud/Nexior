import { authOperator } from '@/operators/auth';
import { getBaseUrlAuth } from './baseUrl';
import { withCurrentSite } from './crossSiteUser';
import { isDesktop, isNative } from './surface';

export function isAuthFrontendUrl(value: string): boolean {
  try {
    return new URL(value).origin === new URL(getBaseUrlAuth()).origin;
  } catch {
    return false;
  }
}

export function getConnectorSiteOrigin(): string | undefined {
  if (typeof window === 'undefined' || isNative() || isDesktop()) return undefined;
  return ['http:', 'https:'].includes(window.location.protocol) ? window.location.origin : undefined;
}

export function buildConnectorContinuationUrl(handoffToken: string): string | undefined {
  if (!handoffToken) return undefined;
  const continuation = new URL('/connections/continue', getBaseUrlAuth());
  continuation.searchParams.set('handoff', handoffToken);
  return withCurrentSite(continuation.toString());
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

export async function prepareConnectorAuthorizationUrl(
  authorizationUrl: string,
  handoffToken?: string
): Promise<string> {
  const continuation = handoffToken ? buildConnectorContinuationUrl(handoffToken) : undefined;
  return withAuthFrontendSession(continuation || authorizationUrl);
}
