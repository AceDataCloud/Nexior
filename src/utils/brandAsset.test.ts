import { describe, expect, it } from 'vitest';

import { defaultBrandAssetAppearance, selectBrandAssetUrls } from './brandAsset';

const assets = {
  color: 'color.png',
  light: 'black.png',
  dark: 'white.png',
  adaptiveDark: 'color-white-text.png'
};

describe('brand asset variants', () => {
  it('defaults logos to adaptive mode even when the source is already transparent', () => {
    expect(defaultBrandAssetAppearance('logo')).toBe('balanced');
  });

  it('uses color on light and white on dark in adaptive mode', () => {
    expect(selectBrandAssetUrls('logo', 'balanced', assets)).toEqual({
      light: 'color.png',
      dark: 'color-white-text.png'
    });
  });

  it('keeps one transparent color favicon for both browser themes', () => {
    expect(selectBrandAssetUrls('favicon', 'balanced', assets)).toEqual({
      light: 'color.png',
      dark: 'color.png'
    });
  });

  it('keeps favicon semantics independent from logo appearance', () => {
    expect(defaultBrandAssetAppearance('favicon')).toBe('brand');
  });

  it('keeps pure white dark assets for monochrome mode', () => {
    expect(selectBrandAssetUrls('logo', 'mono', assets)).toEqual({ light: 'black.png', dark: 'white.png' });
  });
});
