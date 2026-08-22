import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import { makeFlatLoader } from '@acedatacloud/core/i18n';

const localeModules = import.meta.glob('./*/site.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;
const localePaths = Object.keys(localeModules);
const required = [
  'banner.systemTitle',
  'banner.systemTip',
  'banner.customTitle',
  'banner.customTip',
  'banner.add',
  'banner.empty',
  'banner.createTitle',
  'banner.image',
  'banner.link',
  'banner.visible',
  'banner.loadFailed'
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

describe('site banner locales', () => {
  it('resolves Banner settings copy through the production Site loader', async () => {
    expect(localePaths).toHaveLength(12);
    for (const path of localePaths) {
      const locale = path.split('/')[1];
      const messages = await loadMessages(locale);
      for (const key of required) {
        const resolved = messages[`site.${key}`];
        expect(resolved, `${path}: ${key}`).toBeTruthy();
        expect(resolved, `${path}: ${key}`).not.toBe(`site.${key}`);
      }
    }
  });

  it('does not ship English Banner placeholders to generated locales', async () => {
    const english = (await loadMessages('en'))['site.banner.systemTip'];
    for (const path of localePaths) {
      const locale = path.split('/')[1];
      if (locale === 'en' || locale === 'zh-CN') continue;
      const messages = await loadMessages(locale);
      expect(messages['site.banner.systemTip'], path).not.toBe(english);
    }
  });
});
