import { describe, expect, it } from 'vitest';
import { officialSiteHost, wechatRedirect } from './officialHost';

const canonical = 'studio.acedata.cloud';

describe('WeChat official aliases', () => {
  it('normalizes only reserved date labels', () => {
    expect(officialSiteHost(`20261002.${canonical}`, canonical)).toBe(canonical);
    for (const host of [`tenant.${canonical}`, `nested.20261002.${canonical}`, `20261002.${canonical}.evil.com`]) {
      expect(officialSiteHost(host, canonical)).toBe(host);
    }
  });

  it('preserves query and hash before login', () => {
    expect(
      wechatRedirect(
        `https://${canonical}/chat/123?mode=music&lang=zh-CN#draft`,
        canonical,
        new Date('2026-10-02T12:00:00Z')
      )
    ).toBe(`https://20261002.${canonical}/chat/123?mode=music&lang=zh-CN#draft`);
  });

  it('never rotates callbacks or already dated origins at midnight', () => {
    for (const href of [
      `https://${canonical}/auth/callback?code=once&redirect=%2Fchat`,
      `https://20261002.${canonical}/auth/callback?code=once`,
      `https://tenant.${canonical}/chat`
    ])
      expect(wechatRedirect(href, canonical, new Date('2026-10-03T01:00:00Z'))).toBeUndefined();
  });
});
