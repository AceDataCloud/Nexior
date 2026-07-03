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

// The app runs vue-i18n in legacy mode; assert both modes so the test can't be a
// false-negative relative to production.
const LEGACY_MODES = [true, false] as const;

// Regression guard for the "Local Tools panel is blank" bug: a bare `@` inside a
// rendered translation makes vue-i18n's message compiler throw INVALID_LINKED_FORMAT
// at render time, which the app's errorHandler swallows -> the whole panel renders
// as an empty comment node. Every Local Tools string must compile without throwing.
describe('Local Tools i18n messages compile (no blank-panel regression)', () => {
  for (const [path, mod] of Object.entries(bundles)) {
    const locale = localeOf(path);
    const source = mod.default;
    const localToolsKeys = Object.keys(source).filter((k) => k.startsWith('settings.localTools'));

    it(`[${locale}] all settings.localTools* messages compile via vue-i18n`, () => {
      expect(localToolsKeys.length).toBeGreaterThan(0);
      const messages: Record<string, string> = {};
      localToolsKeys.forEach((k, i) => (messages[`k${i}`] = messageOf(source[k])));
      for (const legacy of LEGACY_MODES) {
        const i18n: any = createI18n({ legacy, locale, messages: { [locale]: messages } });
        localToolsKeys.forEach((k, i) => {
          // Compilation happens on first `t()`; an unescaped control char throws here.
          expect(() => i18n.global.t(`k${i}`), `message for "${k}" must compile (legacy=${legacy})`).not.toThrow();
        });
      }
    });

    it(`[${locale}] MCP platform hint renders a literal @modelcontextprotocol`, () => {
      const raw = messageOf(source['settings.localToolsMcpPlatformHint']);
      expect(raw, 'localToolsMcpPlatformHint must exist').toBeTruthy();
      for (const legacy of LEGACY_MODES) {
        const i18n: any = createI18n({ legacy, locale, messages: { [locale]: { hint: raw } } });
        const rendered = i18n.global.t('hint');
        // The escaped `{'@'}` must resolve back to a plain `@` in the example command.
        expect(rendered).toContain('@modelcontextprotocol/server-filesystem');
        expect(rendered).not.toContain("{'@'}");
      }
    });
  }
});
