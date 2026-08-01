import type { ISite } from '@/models';
import { I18N_DEFAULT_LOCALE, I18N_SUPPORTED_LOCALES, type I18nLocaleOption } from '@/constants/i18n';

export const getSiteLocaleOptions = (supportedLocales?: string[] | null): I18nLocaleOption[] => {
  if (!Array.isArray(supportedLocales) || supportedLocales.length === 0) return I18N_SUPPORTED_LOCALES;
  const selected = new Set(supportedLocales);
  const options = I18N_SUPPORTED_LOCALES.filter((locale) => selected.has(locale.value));
  return options.length > 0 ? options : I18N_SUPPORTED_LOCALES;
};

export const resolveSiteLocale = (currentLocale: string, site?: ISite | null): string => {
  const options = getSiteLocaleOptions(site?.supported_locales);
  const allowed = new Set(options.map((locale) => locale.value));
  if (allowed.has(currentLocale)) return currentLocale;
  if (site?.language && allowed.has(site.language)) return site.language;
  if (allowed.has(I18N_DEFAULT_LOCALE)) return I18N_DEFAULT_LOCALE;
  return options[0].value;
};
