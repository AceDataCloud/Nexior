import { describe, expect, it } from 'vitest';
import { createI18n } from 'vue-i18n';

// Load every locale's `common` bundle exactly as it ships in the repo.
const bundles = import.meta.glob('../../i18n/*/common.json', { eager: true }) as Record<
  string,
  { default: Record<string, { message?: string } | string> }
>;

const localeOf = (path: string) => path.replace(/.*\/i18n\/([^/]+)\/common\.json$/, '$1');

const messageOf = (entry: { message?: string } | string): string =>
  typeof entry === 'string' ? entry : (entry?.message ?? '');

const LEGACY_MODES = [true, false] as const;

// Regression guard (same class of bug as LocalTools.i18n.test.ts): an
// unescaped `@` or control char in a translation makes vue-i18n's compiler
// throw at render time; the app's errorHandler swallows it and the whole
// Memory settings panel renders blank. Every settings.memory* string that
// ships in a locale must compile in both legacy + composition modes.
//
// We do NOT require cross-locale parity here: per repo policy only en + zh-CN
// are hand-authored; other locales are backfilled by the translate pipeline
// later. So we only assert English carries the keys, and compile whatever is
// present in each locale.
describe('Memory settings i18n messages compile (no blank-panel regression)', () => {
  for (const [path, mod] of Object.entries(bundles)) {
    const locale = localeOf(path);
    const source = mod.default;
    const memoryKeys = Object.keys(source).filter((k) => k.startsWith('settings.memory'));

    if (locale === 'en') {
      it('[en] ships the settings.memory* keys', () => {
        expect(memoryKeys.length).toBeGreaterThan(0);
      });
    }

    if (memoryKeys.length === 0) continue;

    it(`[${locale}] all settings.memory* messages compile via vue-i18n`, () => {
      const messages: Record<string, string> = {};
      memoryKeys.forEach((k, i) => (messages[`k${i}`] = messageOf(source[k])));
      for (const legacy of LEGACY_MODES) {
        const i18n: any = createI18n({ legacy, locale, messages: { [locale]: messages } });
        memoryKeys.forEach((k, i) => {
          expect(() => i18n.global.t(`k${i}`), `message for "${k}" must compile (legacy=${legacy})`).not.toThrow();
        });
      }
    });
  }
});
