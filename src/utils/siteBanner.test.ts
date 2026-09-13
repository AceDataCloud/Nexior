import { describe, expect, it } from 'vitest';
import { resolveSiteBannerText } from './siteBanner';

describe('site banner helpers', () => {
  it('resolves exact, language, English, and first-value fallbacks', () => {
    const map = { 'zh-CN': '中文', en: 'English', fr: 'Français' };
    expect(resolveSiteBannerText(map, 'zh-CN')).toBe('中文');
    expect(resolveSiteBannerText({ 'pt-BR': 'Português', en: 'English' }, 'pt-PT')).toBe('Português');
    expect(resolveSiteBannerText(map, 'ja')).toBe('English');
    expect(resolveSiteBannerText({ fr: 'Français' }, 'ja')).toBe('Français');
  });
});
