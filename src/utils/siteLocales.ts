import type { ISite } from '@/models';
import { I18N_DEFAULT_LOCALE, I18N_SUPPORTED_LOCALES, type I18nLocaleOption } from '@/constants/i18n';

export const getSiteLocaleOptions = (supportedLocales?: string[] | null): I18nLocaleOption[] => {
  if (!Array.isArray(supportedLocales) || supportedLocales.length === 0) return I18N_SUPPORTED_LOCALES;
  const selected = new Set(supportedLocales);
  const options = I18N_SUPPORTED_LOCALES.filter((locale) => selected.has(locale.value));
  return options.length > 0 ? options : I18N_SUPPORTED_LOCALES;
};

/**
 * The site pins every visitor to one language. Unset means auto-detect.
 * Ignores values we ship no bundle for, so a stale row can't strand the UI
 * on a locale that would render as raw keys.
 */
export const getForcedLocale = (site?: ISite | null): string | undefined => {
  const forced = site?.forced_locale;
  if (!forced) return undefined;
  return I18N_SUPPORTED_LOCALES.some((locale) => locale.value === forced) ? forced : undefined;
};

export const resolveSiteLocale = (currentLocale: string, site?: ISite | null): string => {
  const forced = getForcedLocale(site);
  if (forced) return forced;
  const options = getSiteLocaleOptions(site?.supported_locales);
  const allowed = new Set(options.map((locale) => locale.value));
  if (allowed.has(currentLocale)) return currentLocale;
  if (site?.language && allowed.has(site.language)) return site.language;
  if (allowed.has(I18N_DEFAULT_LOCALE)) return I18N_DEFAULT_LOCALE;
  return options[0].value;
};

/**
 * Boot-time locale decision. Must be driven by the saved LOCALE cookie, never
 * by `i18n.global.locale` — at boot the router guard that applies the cookie
 * has not run yet, so the live locale is still the vue-i18n default.
 */
export const resolveBootLocale = (savedLocale: string | undefined, site?: ISite | null): string =>
  resolveSiteLocale(savedLocale || I18N_DEFAULT_LOCALE, site);
