import { describe, expect, it } from 'vitest';

import { parseInviterFromDeepLink, parseInviterFromReferrer } from './attributionParse';

describe('parseInviterFromDeepLink', () => {
  it('reads inviter_id from the /i/<id> path form (App/Universal Link)', () => {
    expect(parseInviterFromDeepLink('https://studio.acedata.cloud/i/abc-123')).toBe('abc-123');
  });

  it('reads inviter_id from a query param', () => {
    expect(parseInviterFromDeepLink('https://studio.acedata.cloud/?inviter_id=xyz')).toBe('xyz');
  });

  it('prefers an explicit query param over the path segment', () => {
    expect(parseInviterFromDeepLink('https://studio.acedata.cloud/i/path-one?inviter_id=query-one')).toBe('query-one');
  });

  it('url-decodes the path segment', () => {
    expect(parseInviterFromDeepLink('https://studio.acedata.cloud/i/a%20b')).toBe('a b');
  });

  it('returns null for URLs without a referral', () => {
    expect(parseInviterFromDeepLink('https://studio.acedata.cloud/chat')).toBeNull();
  });

  it('ignores an auth callback custom-scheme URL', () => {
    expect(parseInviterFromDeepLink('com.acedatacloud.nexior://auth/callback?code=123')).toBeNull();
  });

  it('returns null for unparseable input', () => {
    expect(parseInviterFromDeepLink('not a url')).toBeNull();
  });
});

describe('parseInviterFromReferrer', () => {
  it('splits the Play install-referrer blob', () => {
    expect(parseInviterFromReferrer('inviter_id=abc&click_id=def')).toEqual({
      inviterId: 'abc',
      clickId: 'def'
    });
  });

  it('handles a missing click_id', () => {
    expect(parseInviterFromReferrer('inviter_id=abc')).toEqual({ inviterId: 'abc', clickId: null });
  });

  it('handles an empty / organic referrer', () => {
    expect(parseInviterFromReferrer('')).toEqual({ inviterId: null, clickId: null });
    expect(parseInviterFromReferrer('utm_source=google-play&utm_medium=organic')).toEqual({
      inviterId: null,
      clickId: null
    });
  });
});
