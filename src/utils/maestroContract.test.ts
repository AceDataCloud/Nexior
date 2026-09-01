import { describe, expect, it } from 'vitest';
import { clampMaestroDuration, clampMaestroLanguages, estimateMaestroCredits } from './maestroContract';

describe('Maestro universal contract', () => {
  it('uses one duration and language boundary', () => {
    expect(clampMaestroDuration(1)).toBe(5);
    expect(clampMaestroDuration(300)).toBe(300);
    expect(clampMaestroDuration(999)).toBe(300);
    expect(clampMaestroLanguages(['zh-cn', 'en', 'ja', 'fr', 'de'])).toEqual(['zh-cn', 'en', 'ja', 'fr']);
  });

  it('uses the flat base rate with retained modifiers', () => {
    expect(estimateMaestroCredits(30)).toBe(18);
    expect(estimateMaestroCredits(30, 'avatar')).toBe(20.7);
    expect(estimateMaestroCredits(30, 'drama')).toBe(24.3);
    expect(estimateMaestroCredits(30, 'auto', 3)).toBe(30);
  });
});
