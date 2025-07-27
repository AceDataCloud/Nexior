import { createI18n } from 'vue-i18n';
import { I18N_DEFAULT_LOCALE, I18N_SCOPES, I18N_SUPPORTED_LOCALES } from '@/constants/i18n';
import axios from 'axios';
import { nextTick } from 'vue';

export const i18n = createI18n({
  legacy: true
});

export const getLocale = (lang?: string): string => {
  const canonicalLang = Intl.getCanonicalLocales(lang || navigator.language)?.[0];
  console.debug('canonicalLang', canonicalLang);
  const supportedLocales = I18N_SUPPORTED_LOCALES.map((locale) => locale.value);
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
  return I18N_DEFAULT_LOCALE;
};

const messageLoaders = import.meta.glob('./**/*.json');

export const loadLocaleResource = async (name: string, locale: string) => {
  console.debug('loadLocaleResource', name, locale);
  const path = `./${locale}/${name}.json`;
  const loader = messageLoaders[path];
  if (!loader) {
    console.warn(`[i18n] Missing translation file: ${path}`);
    return;
  }

  const module: any = await loader();
  console.debug('loaded module', module);
  if (!module.default) {
    console.warn(`[i18n] Missing default export in translation file: ${path}`);
    return;
  }
  return module.default;
};

export const loadLocaleMessages = async (locale: string) => {
  const promises = I18N_SCOPES.map((name) => loadLocaleResource(name, locale));
  const resources = await Promise.all(promises);

  const messages: any = {};
  I18N_SCOPES.forEach((name, index) => {
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
    await loadLocaleMessages(locale);
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
