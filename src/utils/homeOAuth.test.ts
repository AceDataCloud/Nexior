import { describe, expect, it } from 'vitest';
import { getHomeOAuthConfig, homeOAuthAuthorizeUrl, parseHomeOAuthRequest } from './homeOAuth';

const section = {
  kind: 'website' as const,
  title: 'ABC',
  body: 'https://abc.example/embed',
  oauth: { client_id: 'abc-client', redirect_uri: 'https://abc.example/callback' }
};
const request = {
  type: 'acedatacloud:oauth:authorize',
  state: 'random_state_123456',
  code_challenge: 'a'.repeat(43),
  code_challenge_method: 'S256'
};

describe('embedded OAuth boundaries', () => {
  it('requires HTTPS, a distinct website origin and a same-origin callback', () => {
    expect(getHomeOAuthConfig(section, 'https://studio.example')?.origin).toBe('https://abc.example');
    expect(getHomeOAuthConfig(section, 'https://abc.example')).toBeNull();
    expect(getHomeOAuthConfig(section, 'http://studio.example')).toBeNull();
    for (const callback of [
      'https://evil.example/callback',
      'https://abc.example:444/callback',
      'https://abc.example/callback#code',
      'http://abc.example/callback'
    ]) {
      expect(
        getHomeOAuthConfig(
          { ...section, oauth: { ...section.oauth, redirect_uri: callback } },
          'https://studio.example'
        )
      ).toBeNull();
    }
  });
  it('accepts S256 challenges and rejects malformed or downgraded requests', () => {
    expect(parseHomeOAuthRequest(request)?.state).toBe(request.state);
    for (const data of [
      null,
      {},
      { ...request, state: '' },
      { ...request, code_challenge: 'short' },
      { ...request, code_challenge_method: 'plain' }
    ])
      expect(parseHomeOAuthRequest(data)).toBeNull();
  });
  it('builds authorization parameters from saved configuration rather than iframe input', () => {
    const url = new URL(
      homeOAuthAuthorizeUrl(
        'https://auth.acedata.cloud',
        section.oauth,
        parseHomeOAuthRequest(request)!,
        'https://studio.example'
      )
    );
    expect(url.searchParams.get('client_id')).toBe('abc-client');
    expect(url.searchParams.get('redirect_uri')).toBe(section.oauth.redirect_uri);
    expect(url.searchParams.get('scope')).toBe('profile:read credentials:read');
    expect(url.searchParams.get('embed_origin')).toBe('https://studio.example');
    expect(url.searchParams.has('access_token')).toBe(false);
  });
});
