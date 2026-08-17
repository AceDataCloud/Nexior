import { describe, expect, it } from 'vitest';

const localeModules = import.meta.glob('./*/site.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;
const required = [
  'title',
  'securityNotice',
  'enabled',
  'required',
  'invalidId',
  'saveFailed',
  'ga4',
  'baidu',
  'clarity',
  'umami'
];

describe('site analytics locales', () => {
  it('keeps the complete analytics tree in every locale', () => {
    expect(Object.keys(localeModules)).toHaveLength(18);
    for (const [path, module] of Object.entries(localeModules)) {
      const analytics = module.default.analytics as Record<string, unknown> | undefined;
      expect(analytics, path).toBeDefined();
      expect(Object.keys(analytics || {}), path).toEqual(expect.arrayContaining(required));
    }
  });

  it('does not ship English placeholders to generated locales', () => {
    const english = (localeModules['./en/site.json'].default.analytics as Record<string, unknown>).securityNotice;
    for (const [path, module] of Object.entries(localeModules)) {
      if (path.includes('/en/') || path.includes('/zh-CN/')) continue;
      const analytics = module.default.analytics as Record<string, unknown>;
      expect(analytics.securityNotice, path).not.toBe(english);
    }
  });
});
