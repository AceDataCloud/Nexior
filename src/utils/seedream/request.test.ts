import { describe, expect, it } from 'vitest';
import { buildSeedreamRequest } from './request';
import { getCompatibleSeedreamAction, getSeedreamAction } from './capabilities';

describe('buildSeedreamRequest', () => {
  it('automatically sends references in edit mode', () => {
    expect(
      buildSeedreamRequest({ action: 'generate', prompt: 'A lighthouse', image: ['https://cdn.example/ref.png'] })
    ).toEqual({ prompt: 'A lighthouse', image: ['https://cdn.example/ref.png'], watermark: false, async: true });
  });

  it('automatically returns to generate mode after references are removed', () => {
    expect(buildSeedreamRequest({ action: 'edit', prompt: 'A lighthouse', image: [] })).toEqual({
      prompt: 'A lighthouse',
      watermark: false,
      async: true
    });
  });

  it('preserves explicit actions for supported models', () => {
    expect(getCompatibleSeedreamAction('edit', 'doubao-seedream-4-5-251128')).toBe('edit');
    expect(getCompatibleSeedreamAction('generate', 'doubao-seedream-4-5-251128')).toBe('generate');
  });

  it('removes group options when group generation is inactive', () => {
    expect(
      buildSeedreamRequest({
        model: 'doubao-seedream-5-0-260128',
        sequential_image_generation: 'disabled',
        sequential_image_generation_options: { max_images: 4 }
      })
    ).toEqual({
      model: 'doubao-seedream-5-0-260128',
      sequential_image_generation: 'disabled',
      watermark: false,
      async: true
    });
  });

  it('disables watermarks for persisted legacy configurations', () => {
    expect(buildSeedreamRequest({ prompt: 'A lighthouse', watermark: true })).toMatchObject({ watermark: false });
  });

  it('derives the action from model capabilities and references', () => {
    const image = ['one.png', 'two.png'];
    expect(getSeedreamAction('doubao-seedream-4-5-251128', [])).toBe('generate');
    expect(getSeedreamAction('doubao-seedream-4-5-251128', image)).toBe('edit');
  });
});

it('trims prompts without mutating config', () => {
  const config = { prompt: '  image prompt  ' };
  expect(buildSeedreamRequest(config).prompt).toBe('image prompt');
  expect(config.prompt).toBe('  image prompt  ');
});

it('builds a Pro decomposition request without a prompt', () => {
  expect(
    buildSeedreamRequest({
      model: 'doubao-seedream-5-0-pro-260628',
      prompt: '   ',
      image: ['one.png', 'two.png'],
      size: '1.5K',
      layer_decomposition: true,
      background: 'transparent',
      stream: true
    })
  ).toEqual({
    model: 'doubao-seedream-5-0-pro-260628',
    image: ['one.png'],
    size: '1.5K',
    layer_decomposition: true,
    watermark: false,
    async: true
  });
});

it('keeps transparent Pro edits in PNG', () => {
  expect(
    buildSeedreamRequest({
      model: 'doubao-seedream-5-0-pro-260628',
      prompt: 'replace the object',
      image: ['layer.png'],
      background: 'transparent',
      output_format: 'jpeg'
    })
  ).toMatchObject({ background: 'transparent', output_format: 'png' });
});

it('keeps Lite groups and web search but drops Pro-only fields', () => {
  const request = buildSeedreamRequest({
    model: 'doubao-seedream-5-0-260128',
    prompt: 'current city skyline',
    sequential_image_generation: 'auto',
    sequential_image_generation_options: { max_images: 3 },
    tools: [{ type: 'web_search' }],
    optimize_prompt_options: { mode: 'standard' },
    layer_decomposition: true,
    background: 'transparent'
  });
  expect(request).toMatchObject({
    sequential_image_generation: 'auto',
    sequential_image_generation_options: { max_images: 3 },
    tools: [{ type: 'web_search' }],
    optimize_prompt_options: { mode: 'standard' }
  });
  expect(request).not.toHaveProperty('layer_decomposition');
  expect(request).not.toHaveProperty('background');
});
