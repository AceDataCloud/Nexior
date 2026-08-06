import { describe, expect, it } from 'vitest';
import { deriveMinimaxMode, parseMinimaxUrls, validateMinimaxConfig } from './minimax';

const base = { model: 'minimax-h3' as const, ratio: '16:9' as const, duration: 4 };

describe('MiniMax request helpers', () => {
  it('parses comma and newline separated media URLs', () => {
    expect(parseMinimaxUrls(' https://a.test/1.png,https://a.test/2.png\n\nhttps://a.test/3.png ')).toEqual([
      'https://a.test/1.png',
      'https://a.test/2.png',
      'https://a.test/3.png'
    ]);
  });

  it('derives audio before image before text mode', () => {
    expect(deriveMinimaxMode([], [])).toBe('text_to_video');
    expect(deriveMinimaxMode(['image'], [])).toBe('image_to_video');
    expect(deriveMinimaxMode(['image'], ['audio'])).toBe('audio_guided');
  });

  it('validates required input and media limits', () => {
    expect(validateMinimaxConfig(base)).toBe('inputRequired');
    expect(validateMinimaxConfig({ ...base, prompt: 'fox' })).toBeUndefined();
    expect(validateMinimaxConfig({ ...base, image_urls: Array(10).fill('image') })).toBe('imageLimit');
    expect(validateMinimaxConfig({ ...base, audio_urls: Array(4).fill('audio') })).toBe('audioLimit');
  });
});
