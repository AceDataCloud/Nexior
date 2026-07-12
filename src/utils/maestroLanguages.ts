import { MAESTRO_ALLOWED_LANGS, MAESTRO_DEFAULT_LANGS } from '@/constants/maestro';

export interface IMaestroLanguageOption {
  value: string;
  label: string;
}

const DISPLAY_LANGUAGE_CODES: Record<string, string> = {
  'zh-cn': 'zh-Hans'
};

const FALLBACK_LANGUAGE_NAMES: Record<string, string> = {
  'zh-cn': '简体中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch'
};

const ALLOWED_LANGUAGES = new Set<string>(MAESTRO_ALLOWED_LANGS);

export const getMaestroLanguageName = (language: string, locale: string): string => {
  const displayCode = DISPLAY_LANGUAGE_CODES[language] || language;
  try {
    return (
      new Intl.DisplayNames([locale], { type: 'language' }).of(displayCode) ||
      FALLBACK_LANGUAGE_NAMES[language] ||
      language
    );
  } catch {
    return FALLBACK_LANGUAGE_NAMES[language] || language;
  }
};

export const getMaestroLanguageOptions = (locale: string): IMaestroLanguageOption[] =>
  MAESTRO_ALLOWED_LANGS.map((value) => ({
    value,
    label: getMaestroLanguageName(value, locale)
  }));

export const normalizeMaestroLanguages = (languages?: string[]): string[] => {
  const normalized = Array.from(new Set((languages || []).filter((language) => ALLOWED_LANGUAGES.has(language))));
  return normalized.length ? normalized : [...MAESTRO_DEFAULT_LANGS];
};

export const setMaestroPrimaryLanguage = (languages: string[], primaryLanguage: string): string[] => {
  const normalized = normalizeMaestroLanguages(languages);
  const nextPrimary = ALLOWED_LANGUAGES.has(primaryLanguage) ? primaryLanguage : normalized[0];
  return [nextPrimary, ...normalized.filter((language) => language !== nextPrimary)];
};

export const setMaestroAdditionalLanguages = (languages: string[], additionalLanguages: string[]): string[] => {
  const primaryLanguage = normalizeMaestroLanguages(languages)[0];
  return normalizeMaestroLanguages([primaryLanguage, ...additionalLanguages]);
};
