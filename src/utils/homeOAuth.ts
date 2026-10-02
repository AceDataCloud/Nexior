import type { ISiteHomeSection } from '@/models';

export const HOME_OAUTH_SCOPE = 'profile:read credentials:read';
export const HOME_OAUTH_APP_SANDBOX =
  'allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox';

export interface HomeOAuthRequest {
  state: string;
  code_challenge: string;
  code_challenge_method: 'S256';
}

export const getHomeOAuthConfig = (section: ISiteHomeSection, parentOrigin: string) => {
  try {
    if (section.kind !== 'website' || !section.oauth?.client_id.trim()) return null;
    const website = new URL(section.body);
    const callback = new URL(section.oauth.redirect_uri);
    if (
      website.protocol !== 'https:' ||
      callback.protocol !== 'https:' ||
      callback.hash ||
      website.username ||
      website.password ||
      callback.username ||
      callback.password ||
      website.origin === parentOrigin ||
      website.origin !== callback.origin ||
      !/^https:\/\//.test(parentOrigin)
    )
      return null;
    return { ...section.oauth, origin: website.origin };
  } catch {
    return null;
  }
};

export const parseHomeOAuthRequest = (data: unknown): HomeOAuthRequest | null => {
  if (!data || typeof data !== 'object') return null;
  const request = data as Record<string, unknown>;
  if (
    request.type !== 'acedatacloud:oauth:authorize' ||
    typeof request.state !== 'string' ||
    !/^[A-Za-z0-9_-]{16,256}$/.test(request.state) ||
    typeof request.code_challenge !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(request.code_challenge) ||
    request.code_challenge_method !== 'S256'
  )
    return null;
  return { state: request.state, code_challenge: request.code_challenge, code_challenge_method: 'S256' };
};

export const homeOAuthAuthorizeUrl = (
  authBase: string,
  config: { client_id: string; redirect_uri: string },
  request: HomeOAuthRequest,
  parentOrigin: string
) => {
  const url = new URL('/oauth2/authorize', authBase);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: config.client_id,
    redirect_uri: config.redirect_uri,
    scope: HOME_OAUTH_SCOPE,
    ...request,
    embed: 'studio',
    embed_origin: parentOrigin
  }).toString();
  return url.toString();
};
