import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import { makeFlatLoader } from '@acedatacloud/core/i18n';

const localeModules = import.meta.glob('./*/site.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;
const localePaths = Object.keys(localeModules);
const required = [
  'analytics.title',
  'analytics.securityNotice',
  'analytics.enabled',
  'analytics.required',
  'analytics.invalidId',
  'analytics.saveFailed',
  'analytics.ga4.description',
  'analytics.baidu.title',
  'analytics.clarity.description',
  'analytics.umami.description'
];

const loadMessages = async (locale: string) => {
  const i18n = createI18n({ legacy: true });
  const loader = makeFlatLoader({
    scopes: ['site'],
    loadResource: async (_scope, requestedLocale) => localeModules[`./${requestedLocale}/site.json`].default
  });
  await loader(i18n, locale);
  return i18n.global.getLocaleMessage(locale) as Record<string, string>;
};

describe('site analytics locales', () => {
  it('resolves every analytics key through the production flat loader', async () => {
    expect(localePaths).toHaveLength(18);
    for (const path of localePaths) {
      const locale = path.split('/')[1];
      const messages = await loadMessages(locale);
      for (const key of required) expect(messages[`site.${key}`], `${path}: ${key}`).toBeTruthy();
    }
  });

  it('does not ship English placeholders to generated locales', async () => {
    const english = (await loadMessages('en'))['site.analytics.securityNotice'];
    for (const path of localePaths) {
      const locale = path.split('/')[1];
      if (locale === 'en' || locale === 'zh-CN') continue;
      const messages = await loadMessages(locale);
      expect(messages['site.analytics.securityNotice'], path).not.toBe(english);
    }
  });
});
