import { describe, expect, it } from 'vitest';
import { I18N_SUPPORTED_LOCALES } from '@/constants/i18n';
import {
  getSiteLocaleOptions,
  getSiteLocaleValues,
  getForcedLocale,
  resolveBootLocale,
  resolveBootLocaleCookie,
  resolveSiteLocale,
  serializeSiteLocales
} from './siteLocales';

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

  it('fails open when a legacy payload contains only removed locales', () => {
    expect(getSiteLocaleOptions(['pl', 'fi', 'sv', 'el', 'uk', 'sr'])).toEqual(I18N_SUPPORTED_LOCALES);
  });

  it('filters removed locales from mixed legacy payloads', () => {
    expect(getSiteLocaleValues(['pl', 'en', 'ja', 'sr'])).toEqual(['en', 'ja']);
  });

  it('serializes only the canonical supported locale set', () => {
    expect(
      serializeSiteLocales(['pl', 'en', 'de', 'pt', 'es', 'fr', 'zh-CN', 'zh-TW', 'it', 'ko', 'ja', 'ru'])
    ).toEqual(['en', 'de', 'pt', 'es', 'fr', 'zh-CN', 'zh-TW', 'it', 'ko', 'ja', 'ru']);
    expect(serializeSiteLocales([...I18N_SUPPORTED_LOCALES.map((locale) => locale.value), 'pl', 'en'])).toBeNull();
  });
});

describe('boot locale', () => {
  it('keeps the saved locale when the site allows it', () => {
    expect(resolveBootLocale('zh-CN', {})).toBe('zh-CN');
    expect(resolveBootLocale('zh-CN', { language: 'en' })).toBe('zh-CN');
    expect(resolveBootLocale('ja', { supported_locales: ['en', 'ja'] })).toBe('ja');
  });

  it('falls back to the default when no locale was saved', () => {
    expect(resolveBootLocale(undefined, {})).toBe('en');
  });

  it('persists the fallback over a removed locale cookie', () => {
    expect(resolveBootLocaleCookie('pl', {})).toEqual({ locale: 'en', shouldPersist: true });
    expect(resolveBootLocaleCookie('ja', {})).toEqual({ locale: 'ja', shouldPersist: false });
  });

  it('overrides a saved locale the site no longer offers', () => {
    expect(resolveBootLocale('zh-CN', { language: 'ja', supported_locales: ['en', 'ja'] })).toBe('ja');
  });
});

describe('forced locale', () => {
  it('is unset by default', () => {
    expect(getForcedLocale({})).toBeUndefined();
    expect(getForcedLocale({ language: 'ja' })).toBeUndefined();
    expect(getForcedLocale(null)).toBeUndefined();
  });

  it('ignores locales we no longer ship bundles for', () => {
    for (const locale of ['pl', 'fi', 'sv', 'el', 'uk', 'sr']) {
      expect(getForcedLocale({ forced_locale: locale })).toBeUndefined();
    }
  });

  it('outranks the saved locale at boot', () => {
    expect(resolveBootLocale('zh-CN', { forced_locale: 'ja' })).toBe('ja');
  });

  it('outranks the user choice and the site default', () => {
    expect(resolveSiteLocale('zh-CN', { forced_locale: 'ja', language: 'en' })).toBe('ja');
  });

  it('falls back to normal resolution when the pin is unusable', () => {
    expect(resolveSiteLocale('zh-CN', { forced_locale: 'xx' })).toBe('zh-CN');
  });
});
