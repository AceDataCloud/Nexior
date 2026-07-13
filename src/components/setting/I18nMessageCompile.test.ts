// @vitest-environment jsdom
import { createI18n } from 'vue-i18n';
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Guard against the class of bug where a literal special char ('@', and to a
// lesser extent '{' '}' '|') in a translated message makes vue-i18n's message
// compiler throw "Message compilation error: Invalid linked format" at render
// time. When that render happens inside a component (e.g. CustomDomain.vue's
// DNS-instructions block), the throw blanks the whole panel.
//
// Regressions this covers:
//   - subsite.message.recordNameHint had a bare '@' (root-domain host record
//     example) -> blanked the Custom Domain settings tab once a non-Active
//     domain row existed, in every locale.
//   - common.about.email = "office@acedata.cloud" (same class, latent).
//
// The i18n instance mirrors production (legacy: true, see src/i18n/index.ts)
// so a legacy-only compiler failure can't slip through.

const i18nRoot = resolve(__dirname, '../../i18n');
const locales = readdirSync(i18nRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const namespacesFor = (locale: string) => readdirSync(resolve(i18nRoot, locale)).filter((f) => f.endsWith('.json'));

describe('i18n messages compile under vue-i18n (production legacy mode)', () => {
  it('finds locale directories', () => {
    expect(locales.length).toBeGreaterThan(0);
  });

  for (const locale of locales) {
    it(`compiles + renders every message for locale=${locale}`, () => {
      const i18n = createI18n({
        legacy: true,
        locale: 'probe',
        missingWarn: false,
        fallbackWarn: false,
        warnHtmlMessage: false,
        messages: { probe: {} }
      });
      const g = i18n.global as unknown as {
        setLocaleMessage: (l: string, m: Record<string, string>) => void;
        t: (k: string) => string;
      };
      const failures: string[] = [];
      for (const ns of namespacesFor(locale)) {
        const dict = JSON.parse(readFileSync(resolve(i18nRoot, locale, ns), 'utf-8')) as Record<
          string,
          { message?: string }
        >;
        for (const [key, entry] of Object.entries(dict)) {
          const message = entry?.message;
          if (typeof message !== 'string') continue;
          g.setLocaleMessage('probe', { k: message });
          try {
            const out = g.t('k');
            // A leaked literal-interpolation escape (author typed {'@'} but it
            // failed to render '@') would surface the raw sequence verbatim.
            if (out.includes("{'")) failures.push(`${ns}:${key}: leaked literal escape -> ${out}`);
          } catch (e) {
            failures.push(`${ns}:${key}: ${(e as Error).message.split('\n')[0]}`);
          }
        }
      }
      expect(failures).toEqual([]);
    });
  }
});
