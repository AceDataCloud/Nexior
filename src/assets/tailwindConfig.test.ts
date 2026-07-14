import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const config = require('../../tailwind.config.js');

describe('Tailwind design tokens', () => {
  it('uses the runtime semantic palette instead of a second brand theme', () => {
    const { colors, boxShadow, keyframes, fontFamily } = config.theme.extend;

    expect(colors.brand).toEqual({
      DEFAULT: 'var(--adc-color-primary)',
      hover: 'var(--el-color-primary-dark-2)',
      subtle: 'var(--adc-color-primary-subtle)'
    });
    expect(colors.surface).toEqual({
      canvas: 'var(--adc-color-surface-page)',
      DEFAULT: 'var(--adc-color-surface)',
      overlay: 'var(--adc-color-surface-overlay)'
    });
    expect(boxShadow.glow).toBe('var(--app-glow-primary)');
    expect(boxShadow['glow-lg']).toBe('var(--app-glow-primary-lg)');
    expect(keyframes.pulseGlow['0%, 100%'].boxShadow).toBe('var(--app-glow-primary)');
    expect(fontFamily.sans).toEqual(['var(--adc-font-family-sans)']);
  });

  it('does not retain the legacy purple or blue-dark palette', () => {
    const serializedTheme = JSON.stringify(config.theme.extend);

    expect(serializedTheme).not.toMatch(/#(?:8b5cf6|7c3aed|6d28d9|5b21b6|4c1d95)/i);
    expect(serializedTheme).not.toMatch(/#(?:0b0d17|111427|1a1d2e|252840)/i);
  });
});
