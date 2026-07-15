// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { CAPABILITY_ICONS, CAPABILITY_KEYS } from '@/constants/capabilities';

const i18nRoot = resolve(__dirname, '../../i18n');
const locales = readdirSync(i18nRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const messageKey = (feature: string) => `message.features${feature.charAt(0).toUpperCase()}${feature.slice(1)}`;
const fieldKey = (feature: string) => `field.features${feature.charAt(0).toUpperCase()}${feature.slice(1)}`;

describe('capability metadata', () => {
  it('provides a favicon for every capability', () => {
    expect(Object.keys(CAPABILITY_ICONS).sort()).toEqual([...CAPABILITY_KEYS].sort());
    for (const feature of CAPABILITY_KEYS) {
      expect(CAPABILITY_ICONS[feature], feature).toBeTruthy();
    }
  });

  it('provides a localized service introduction for every capability', () => {
    const failures: string[] = [];
    for (const locale of locales) {
      const messages = JSON.parse(readFileSync(resolve(i18nRoot, locale, 'site.json'), 'utf8')) as Record<
        string,
        { message?: string }
      >;
      for (const feature of CAPABILITY_KEYS) {
        const label = messages[fieldKey(feature)]?.message?.trim() || '';
        const introduction = messages[messageKey(feature)]?.message?.trim() || '';
        if (!label) failures.push(`${locale}:${fieldKey(feature)}: missing`);
        if (!introduction) failures.push(`${locale}:${messageKey(feature)}: missing`);
        if (/enable or disable|turn .* on or off/i.test(introduction)) {
          failures.push(`${locale}:${messageKey(feature)}: describes the toggle instead of the service`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
