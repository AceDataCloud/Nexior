import { describe, expect, it } from 'vitest';
import { buildSeedreamRequest } from './request';
import { getCompatibleSeedreamAction, getSeedreamAction } from './capabilities';

describe('buildSeedreamRequest', () => {
  it('automatically sends references in edit mode', () => {
    expect(
      buildSeedreamRequest({ action: 'generate', prompt: 'A lighthouse', image: ['https://cdn.example/ref.png'] })
    ).toEqual({ prompt: 'A lighthouse', image: ['https://cdn.example/ref.png'], async: true });
  });

  it('automatically returns to generate mode after references are removed', () => {
    expect(buildSeedreamRequest({ action: 'edit', prompt: 'A lighthouse', image: [] })).toEqual({
      prompt: 'A lighthouse',
      async: true
    });
  });

  it('normalizes actions for text-only and edit-only models', () => {
    expect(getCompatibleSeedreamAction('edit', 'doubao-seedream-3-0-t2i-250415')).toBe('generate');
    expect(getCompatibleSeedreamAction('generate', 'doubao-seededit-3-0-i2i-250628')).toBe('edit');
  });

  it('removes group options when group generation is inactive', () => {
    expect(
      buildSeedreamRequest({
        sequential_image_generation: 'disabled',
        sequential_image_generation_options: { max_images: 4 }
      })
    ).toEqual({ sequential_image_generation: 'disabled', async: true });
  });

  it('derives the action from model capabilities and references', () => {
    const image = ['one.png', 'two.png'];
    expect(getSeedreamAction('doubao-seedream-4-5-251128', [])).toBe('generate');
    expect(getSeedreamAction('doubao-seedream-4-5-251128', image)).toBe('edit');
    expect(getSeedreamAction('doubao-seededit-3-0-i2i-250628', [])).toBe('edit');
    expect(getSeedreamAction('doubao-seedream-3-0-t2i-250415', image)).toBe('generate');
  });
});
