// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { applyAccentColor, parseHex } from './theme';

const managedProperties = [
  '--el-color-primary',
  '--el-color-primary-light-9',
  '--app-brand-bg-light',
  '--app-brand-bg-dark'
];

const channel = (hex: string, offset: number) => parseInt(hex.slice(offset, offset + 2), 16);

const luminance = (hex: string): number => {
  const linear = [1, 3, 5].map((offset) => {
    const value = channel(hex, offset) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrast = (foreground: string, background: string): number => {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

afterEach(() => {
  for (const property of managedProperties) document.documentElement.style.removeProperty(property);
});

describe('applyAccentColor', () => {
  it('keeps theme-aware backgrounds separate from Element Plus light-9', () => {
    document.documentElement.style.setProperty('--el-color-primary-light-9', '#ffffff');

    applyAccentColor('#277186');

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--el-color-primary')).toBe('#277186');
    expect(style.getPropertyValue('--app-brand-bg-light')).toBe('#e9f1f3');
    expect(style.getPropertyValue('--app-brand-bg-dark')).toBe('#12222b');
    expect(style.getPropertyValue('--el-color-primary-light-9')).toBe('');
  });

  it.each([
    ['pale pink', '#fbe8e1'],
    ['white', '#ffffff'],
    ['black', '#000000'],
    ['saturated yellow', '#ffff00'],
    ['short hex', '#f0a']
  ])('keeps %s readable against dark-theme text', (_name, accent) => {
    applyAccentColor(accent);

    const background = document.documentElement.style.getPropertyValue('--app-brand-bg-dark');
    expect(contrast('#e5e7eb', background)).toBeGreaterThanOrEqual(4.5);
  });

  it('removes every theme background override for invalid colours', () => {
    applyAccentColor('#fff');
    applyAccentColor('not-a-colour');

    const style = document.documentElement.style;
    expect(style.getPropertyValue('--el-color-primary')).toBe('');
    expect(style.getPropertyValue('--app-brand-bg-light')).toBe('');
    expect(style.getPropertyValue('--app-brand-bg-dark')).toBe('');
    expect(style.getPropertyValue('--el-color-primary-light-9')).toBe('');
  });
});

describe('theme background tokens', () => {
  it('maps light-9 to the theme-specific brand background', () => {
    const commonScss = readFileSync(resolve(process.cwd(), 'src/assets/scss/_common.scss'), 'utf8');

    expect(commonScss).toMatch(/--app-brand-bg-light: #e9f1f3;/);
    expect(commonScss).toMatch(/--app-brand-bg-dark: #0e2a33;/);
    expect(commonScss).toMatch(/html:root[\s\S]*--el-color-primary-light-9: var\(--app-brand-bg-light\);/);
    expect(commonScss).toMatch(/html\.dark[\s\S]*--el-color-primary-light-9: var\(--app-brand-bg-dark\);/);
  });
});

describe('parseHex', () => {
  it('accepts short and long hex colours', () => {
    expect(parseHex('#abc')).toEqual({ r: 170, g: 187, b: 204 });
    expect(parseHex('277186')).toEqual({ r: 39, g: 113, b: 134 });
  });
});
