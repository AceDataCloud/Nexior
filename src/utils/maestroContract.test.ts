import { describe, expect, it } from 'vitest';
import { clampMaestroDuration, estimateMaestroCredits } from './maestroContract';

describe('Maestro universal contract', () => {
  it('uses the supported duration boundary', () => {
    expect(clampMaestroDuration(1)).toBe(5);
    expect(clampMaestroDuration(300)).toBe(300);
    expect(clampMaestroDuration(999)).toBe(300);
  });

  it('uses one second rate for every video', () => {
    expect(estimateMaestroCredits(5)).toBe(3.5);
    expect(estimateMaestroCredits(30)).toBe(21);
    expect(estimateMaestroCredits(300)).toBe(210);
  });
});
