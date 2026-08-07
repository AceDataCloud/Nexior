import { describe, expect, it } from 'vitest';
import { validateMinimaxConfig } from './minimax';

const base = {
  model: 'minimax-h3' as const,
  resolution: '2K' as const,
  ratio: '16:9' as const,
  duration: 4,
  aigc_watermark: false
};

describe('MiniMax request helpers', () => {
  it('validates required input and media limits', () => {
    expect(validateMinimaxConfig(base)).toBe('promptRequired');
    expect(validateMinimaxConfig({ ...base, prompt: 'fox' })).toBeUndefined();
    expect(validateMinimaxConfig({ ...base, prompt: 'fox', image_urls: Array(10).fill('image') })).toBe('imageLimit');
    expect(validateMinimaxConfig({ ...base, prompt: 'fox', audio_urls: Array(4).fill('audio') })).toBe('audioLimit');
    expect(validateMinimaxConfig({ ...base, prompt: 'fox', audio_urls: ['audio'] })).toBe('audioImageRequired');
  });
});
