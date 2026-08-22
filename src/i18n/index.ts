import { createI18n } from 'vue-i18n';
import { getProductLocale } from '@acedatacloud/core/constants';
import { makeFlatLoader, createSetI18nLanguage } from '@acedatacloud/core/i18n';
import { I18N_SCOPES } from '@/constants/i18n';
import axios from 'axios';
import type { ISite } from '@/models';
import { replaceBrandName } from '@/utils/site';

let resolveBrandSite: () => ISite | null | undefined = () => undefined;

export const setBrandSiteResolver = (resolver: () => ISite | null | undefined): void => {
  resolveBrandSite = resolver;
};

export const i18n = createI18n({
  legacy: true,
  postTranslation: (value) => (typeof value === 'string' ? replaceBrandName(value, resolveBrandSite()) : value)
});

export const getLocale = getProductLocale;

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

// Flat dotted-key loader + setI18nLanguage now come from @acedatacloud/core/i18n;
// the glob loader above + the scope list stay owned here.
const loadLocaleMessagesInternal = makeFlatLoader({ scopes: I18N_SCOPES, loadResource: loadLocaleResource });

export const loadLocaleMessages = (locale: string) => loadLocaleMessagesInternal(i18n, locale);

export const setI18nLanguage = createSetI18nLanguage({
  i18n,
  loadLocaleMessages: loadLocaleMessagesInternal,
  setAxiosLanguageHeader: (locale) => {
    if (axios.defaults.headers) {
      axios.defaults.headers['Accept-Language'] = locale;
    }
  }
});

export const t = i18n.global.t;

export default i18n;
