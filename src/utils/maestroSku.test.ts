import { describe, expect, it } from 'vitest';
import {
  clampMaestroDuration,
  clampMaestroLanguages,
  estimateMaestroCredits,
  isMaestroScenarioAvailable,
  normalizeMaestroSku
} from './maestroSku';

describe('Maestro SKU policy', () => {
  it('migrates legacy persisted qualities', () => {
    expect(normalizeMaestroSku('draft')).toBe('lite');
    expect(normalizeMaestroSku('premium')).toBe('pro');
    expect(normalizeMaestroSku('unknown')).toBe('standard');
  });

  it('clamps duration to each SKU', () => {
    expect(clampMaestroDuration(31, 'lite')).toBe(30);
    expect(clampMaestroDuration(121, 'standard')).toBe(120);
    expect(clampMaestroDuration(301, 'pro')).toBe(300);
    expect(clampMaestroDuration(1, 'lite')).toBe(5);
  });

  it('limits output languages by SKU', () => {
    const langs = ['zh-cn', 'en', 'ja', 'ko'];
    expect(clampMaestroLanguages(langs, 'lite')).toEqual(['zh-cn']);
    expect(clampMaestroLanguages(langs, 'standard')).toEqual(['zh-cn', 'en']);
    expect(clampMaestroLanguages(langs, 'pro')).toEqual(langs);
  });

  it('gates expensive scenarios', () => {
    expect(isMaestroScenarioAvailable('avatar', 'lite')).toBe(false);
    expect(isMaestroScenarioAvailable('avatar', 'standard')).toBe(true);
    expect(isMaestroScenarioAvailable('drama', 'standard')).toBe(false);
    expect(isMaestroScenarioAvailable('drama', 'pro')).toBe(true);
  });

  it('estimates credits using public billing formula', () => {
    expect(estimateMaestroCredits(30, 'lite')).toBe(6);
    expect(estimateMaestroCredits(30, 'standard', 'avatar', 2)).toBe(26.7);
    expect(estimateMaestroCredits(30, 'pro', 'drama')).toBe(48.6);
  });
});
