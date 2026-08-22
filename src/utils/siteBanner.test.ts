import { describe, expect, it } from 'vitest';
import { getHiddenDefaultBannerIds, resolveSiteBannerText, withHiddenDefaultBannerIds } from './siteBanner';

describe('site banner helpers', () => {
  it('resolves exact, language, English, and first-value fallbacks', () => {
    const map = { 'zh-CN': '中文', en: 'English', fr: 'Français' };
    expect(resolveSiteBannerText(map, 'zh-CN')).toBe('中文');
    expect(resolveSiteBannerText({ 'pt-BR': 'Português', en: 'English' }, 'pt-PT')).toBe('Português');
    expect(resolveSiteBannerText(map, 'ja')).toBe('English');
    expect(resolveSiteBannerText({ fr: 'Français' }, 'ja')).toBe('Français');
  });

  it('reads hidden defaults defensively', () => {
    expect(
      getHiddenDefaultBannerIds({ metadata: { nexior: { hidden_default_banner_ids: ['maestro', 1] } } } as any)
    ).toEqual(new Set(['maestro']));
    expect(getHiddenDefaultBannerIds({})).toEqual(new Set());
  });

  it('merges and clears only the Nexior hidden-default key', () => {
    const metadata = { pricing: { markup_ratio: 1 }, nexior: { keep: true } } as any;
    expect(withHiddenDefaultBannerIds(metadata, ['maestro'])).toEqual({
      pricing: { markup_ratio: 1 },
      nexior: { keep: true, hidden_default_banner_ids: ['maestro'] }
    });
    expect(withHiddenDefaultBannerIds(metadata, [])).toEqual({ pricing: { markup_ratio: 1 }, nexior: { keep: true } });
  });
});
