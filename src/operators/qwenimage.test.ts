import { describe, expect, it } from 'vitest';
import { buildQwenImageRequest } from '@/utils/qwenimage/request';

describe('buildQwenImageRequest', () => {
  it('maps uploaded images to image_urls and enables async', () => {
    const result = buildQwenImageRequest({ model: 'qwen-image-3.0-pro', prompt: 'edit', image: ['a', 'b'], n: 2 });
    expect(result.image_urls).toEqual(['a', 'b']);
    expect(result).not.toHaveProperty('image');
    expect(result.async).toBe(true);
    expect(result.watermark).toBe(false);
  });
});

it('trims prompts without mutating config', () => {
  const config = { prompt: '  image prompt  ' };
  expect(buildQwenImageRequest(config).prompt).toBe('image prompt');
  expect(config.prompt).toBe('  image prompt  ');
});
