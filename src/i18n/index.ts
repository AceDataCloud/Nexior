import { createI18n, I18n } from 'vue-i18n';
import { nextTick } from 'vue';
import axios from 'axios';

declare namespace Intl {
  function getCanonicalLocales(locales: string | string[] | undefined): string[];
}

export const DEFAULT_LOCALE = 'en';

export const SUPPORTED_LOCALES = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'pt', label: 'Português' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'it', label: 'Italiano' },
  { value: 'ko', label: '한국어' },
  { value: 'ja', label: '日本語' },
  { value: 'ru', label: 'Русский' },
  { value: 'pl', label: 'Polski' },
  { value: 'fi', label: 'Suomi' },
  { value: 'sv', label: 'Svenska' },
  { value: 'el', label: 'Ελληνικά' },
  { value: 'uk', label: 'Українська' },
  { value: 'ar', label: 'العربية' },
  { value: 'sr', label: 'Српски' }
];

export const setupI18n = () => {
  // @ts-ignore
  const i18n: I18n = createI18n({});
  return i18n;
};

export const i18n: I18n = setupI18n();

export const loadLocalResource = async (name: string, locale: string) => {
  try {
    const module = await import(`./${locale}/${name}.json`);
    return module.default;
  } catch (error) {
    const module = await import(`./${DEFAULT_LOCALE}/${name}.json`);
    return module.default;
  }
};

export const getLocale = (lang?: string): string => {
  const canonicalLang = Intl.getCanonicalLocales(lang || navigator.language)?.[0];
  const supportedLocales = SUPPORTED_LOCALES.map((locale) => locale.value);
  // if the canonical language is supported, use it
  if (canonicalLang && supportedLocales.includes(canonicalLang)) {
    console.debug('canonicalLang', canonicalLang);
    return canonicalLang;
  } else {
    // if the canonical language prefix is supported, use it
    const canonicalLangPrefix = canonicalLang?.split('-')?.[0];
    if (canonicalLangPrefix && supportedLocales.includes(canonicalLangPrefix)) {
      console.debug('canonicalLangPrefix', canonicalLangPrefix);
      return canonicalLangPrefix;
    }
  }
  return DEFAULT_LOCALE;
};

export const loadLocaleMessages = async (i18n: I18n, locale: string) => {
  const names = [
    'index',
    'api',
    'application',
    'qrart',
    'luma',
    'headshots',
    'suno',
    'common',
    'console',
    'credential',
    'distribution',
    'order',
    'proxy',
    'service',
    'usage',
    'user',
    'site',
    'chat',
    'midjourney',
    'chatdoc'
  ];

  const promises = names.map((name) => loadLocalResource(name, locale));
  const resources = await Promise.all(promises);

  const messages: any = {};
  names.forEach((name, index) => {
    const resource = resources[index];
    for (const key in resource) {
      if (resource.hasOwnProperty(key)) {
        const element = resource[key];
        messages[`${name}.${key}`] = element.message;
      }
    }
  });

  // set locale and locale message
  i18n.global.setLocaleMessage(locale, messages);

  return nextTick();
};

export const setI18nLanguage = async (locale: string) => {
  // load locale messages
  if (!i18n.global.availableLocales.includes(locale)) {
    await loadLocaleMessages(i18n, locale);
  }

  // set global locale
  if (i18n.mode === 'legacy') {
    i18n.global.locale = locale;
  } else {
    // @ts-ignore
    i18n.global.locale.value = locale;
  }

  // set global axios headers
  if (axios.defaults.headers) {
    axios.defaults.headers['Accept-Language'] = locale;
  }

  // set global dom html lang attribute
  const htmlDom = document.querySelector('html');
  if (htmlDom) {
    htmlDom.setAttribute('lang', locale);
  }
};

export const t = i18n.global.t;

export default i18n;
