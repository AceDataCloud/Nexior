import { createI18n } from 'vue-i18n';
import { describe, expect, it } from 'vitest';
import { makeFlatLoader } from '@acedatacloud/core/i18n';

const localeModules = import.meta.glob('./*/common.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;
const scopedLocaleModules = import.meta.glob('./*/{byok,skill,grokvideo,omni,producer,suno,subsite}.json', {
  eager: true
}) as Record<string, { default: Record<string, unknown> }>;
const sourceModules = import.meta.glob('../{components,pages}/**/*.{vue,ts}', {
  eager: true,
  query: '?raw',
  import: 'default'
}) as Record<string, string>;
const localePaths = Object.keys(localeModules);
const monitoredSourceSuffixes = [
  '/components/setting/Analytics.vue',
  '/components/setting/SiteServices.vue',
  '/components/setting/Byok.vue',
  '/components/setting/byok/Dialog.vue',
  '/components/setting/CustomDomain.vue',
  '/components/skill/SkillFilePreview.vue',
  '/components/skill/UploadSkillDialog.vue',
  '/components/skill/WriteSkillDialog.vue',
  '/components/grokvideo/task/Preview.vue',
  '/components/omni/task/Preview.vue',
  '/components/producer/task/Preview.vue',
  '/components/suno/task/Preview.vue',
  '/pages/console/skills/Index.vue'
];
const monitoredSourceModules = Object.fromEntries(
  Object.entries(sourceModules).filter(([path]) => monitoredSourceSuffixes.some((suffix) => path.endsWith(suffix)))
);

const canonicalActions = ['save', 'cancel', 'delete', 'edit', 'download', 'refresh'];
const canonicalMessages = ['saved'];
const removedScopedKeys: Record<string, string[]> = {
  byok: ['button.save', 'button.cancel', 'button.delete', 'button.edit'],
  skill: ['button.save', 'button.cancel', 'button.delete', 'button.edit'],
  grokvideo: ['button.download'],
  omni: ['button.download'],
  producer: ['button.download'],
  suno: ['button.download', 'button.delete'],
  subsite: ['button.refresh']
};

const loadMessages = async (locale: string) => {
  const i18n = createI18n({ legacy: true });
  const loader = makeFlatLoader({
    scopes: ['common'],
    loadResource: async (_scope, requestedLocale) => localeModules[`./${requestedLocale}/common.json`].default
  });
  await loader(i18n, locale);
  return i18n.global.getLocaleMessage(locale) as Record<string, string>;
};

describe('common action locales', () => {
  it('resolves canonical action labels through the production flat loader in every locale', async () => {
    expect(localePaths).toHaveLength(12);
    for (const path of localePaths) {
      const locale = path.split('/')[1];
      const messages = await loadMessages(locale);
      for (const action of canonicalActions) {
        const key = `common.button.${action}`;
        expect(messages[key], `${path}: ${key}`).toBeTruthy();
        expect(messages[key], `${path}: ${key}`).not.toBe(key);
      }
      for (const message of canonicalMessages) {
        const key = `common.message.${message}`;
        expect(messages[key], `${path}: ${key}`).toBeTruthy();
        expect(messages[key], `${path}: ${key}`).not.toBe(key);
      }
    }
  });

  it('preserves locale-preferred save terminology', async () => {
    expect((await loadMessages('zh-TW'))['common.button.save']).toBe('儲存');
  });

  it('keeps migrated actions out of scoped locale bundles', () => {
    for (const [path, module] of Object.entries(scopedLocaleModules)) {
      const namespace = path.match(/\/([^/]+)\.json$/)?.[1];
      if (!namespace) throw new Error(`Cannot resolve namespace from ${path}`);
      for (const key of removedScopedKeys[namespace] || []) {
        expect(module.default, `${path}: ${key}`).not.toHaveProperty(key);
      }
    }
  });

  it('does not reintroduce migrated scoped action references', () => {
    expect(Object.keys(monitoredSourceModules)).toHaveLength(monitoredSourceSuffixes.length);
    const source = Object.values(monitoredSourceModules).join('\n');
    for (const [namespace, keys] of Object.entries(removedScopedKeys)) {
      for (const key of keys) {
        expect(source).not.toContain(`'${namespace}.${key}'`);
        expect(source).not.toContain(`\"${namespace}.${key}\"`);
      }
    }
  });
});

const zhLocaleModules = import.meta.glob('./zh-CN/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;

describe('static translation references', () => {
  it('resolves every literal $t namespace key against zh-CN', () => {
    const namespaces = Object.fromEntries(
      Object.entries(zhLocaleModules).map(([path, module]) => [path.match(/\/([^/]+)\.json$/)?.[1], module.default])
    );
    const referencePattern = /\$t\(\s*['"]([A-Za-z0-9_-]+)\.([A-Za-z0-9_.-]+)['"](?=\s*[,\)])/g;

    expect(Object.keys(monitoredSourceModules)).toHaveLength(monitoredSourceSuffixes.length);
    for (const [path, source] of Object.entries(monitoredSourceModules)) {
      for (const match of source.matchAll(referencePattern)) {
        const [, namespace, key] = match;
        expect(namespaces[namespace], `${path}: unknown namespace ${namespace}`).toBeDefined();
        expect(namespaces[namespace], `${path}: missing ${namespace}.${key}`).toHaveProperty(key);
      }
    }
  });
});
