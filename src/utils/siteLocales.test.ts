import { describe, expect, it } from 'vitest';
import { I18N_SUPPORTED_LOCALES } from '@/constants/i18n';
import { getSiteLocaleOptions, resolveSiteLocale } from './siteLocales';

describe('site locale policy', () => {
  it('supports every locale when the site has no explicit selection', () => {
    expect(getSiteLocaleOptions()).toEqual(I18N_SUPPORTED_LOCALES);
    expect(getSiteLocaleOptions([])).toEqual(I18N_SUPPORTED_LOCALES);
  });

  it('filters locale options in canonical display order', () => {
    expect(getSiteLocaleOptions(['zh-CN', 'en', 'ja']).map((locale) => locale.value)).toEqual(['en', 'zh-CN', 'ja']);
  });

  it('falls back to the site default, English, then the first enabled locale', () => {
    expect(resolveSiteLocale('de', { language: 'ja', supported_locales: ['zh-CN', 'ja'] })).toBe('ja');
    expect(resolveSiteLocale('de', { supported_locales: ['zh-CN', 'en'] })).toBe('en');
    expect(resolveSiteLocale('de', { supported_locales: ['zh-CN', 'ja'] })).toBe('zh-CN');
  });

  it('fails open when a legacy payload contains no recognized locale', () => {
    expect(getSiteLocaleOptions(['xx'])).toEqual(I18N_SUPPORTED_LOCALES);
  });
});
