import { describe, expect, it } from 'vitest';
import { validateMinimaxConfig } from './minimax';

const base = {
  model: 'MiniMax-H3' as const,
  content: [],
  resolution: '2K' as const,
  ratio: '16:9' as const,
  duration: 4,
  aigc_watermark: false
};

describe('MiniMax request helpers', () => {
  it('validates required input and media limits', () => {
    expect(validateMinimaxConfig(base)).toBe('promptRequired');
    expect(validateMinimaxConfig({ ...base, content: [{ type: 'text', text: 'fox' }] })).toBeUndefined();
    expect(validateMinimaxConfig({ ...base, content: [{ type: 'text', text: 'fox' }], ratio: 'adaptive' })).toBe(
      'textRatioRequired'
    );
    expect(
      validateMinimaxConfig({
        ...base,
        content: [
          { type: 'text', text: 'fox' },
          ...Array.from({ length: 10 }, (_, index) => ({
            type: 'image_url' as const,
            image_url: { url: `https://cdn.test/${index}.png` },
            role: 'reference_image' as const
          }))
        ]
      })
    ).toBe('imageLimit');
    expect(
      validateMinimaxConfig({
        ...base,
        content: [
          { type: 'text', text: 'fox' },
          ...Array.from({ length: 4 }, (_, index) => ({
            type: 'audio_url' as const,
            audio_url: { url: `https://cdn.test/${index}.mp3` },
            role: 'reference_audio' as const
          }))
        ]
      })
    ).toBe('audioLimit');
  });
});
