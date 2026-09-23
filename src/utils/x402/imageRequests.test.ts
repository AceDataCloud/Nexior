import { describe, expect, it } from 'vitest';
import { buildNanobananaRequest, buildOpenAIImageGenerateRequest } from './imageRequests';

const GPT_IMAGE_25_MODELS = [
  'gpt-image-2.5-flare',
  'gpt-image-2.5-flare:official',
  'gpt-image-2.5-sunburst',
  'gpt-image-2.5-sunburst:official'
];

describe('x402 image request builders', () => {
  it('builds the same trimmed Nano Banana payload for quote and generation without mutating config', () => {
    const config = {
      model: 'nano-banana-2',
      prompt: '  banana  ',
      image_urls: [] as string[],
      aspect_ratio: '',
      resolution: ''
    };

    expect(buildNanobananaRequest(config)).toEqual({
      model: 'nano-banana-2',
      prompt: 'banana',
      resolution: '1K',
      action: 'generate',
      async: true
    });

    expect(config.prompt).toBe('  banana  ');

    expect(
      buildNanobananaRequest({
        model: 'nano-banana-pro',
        prompt: '  edit the background  ',
        image_urls: ['https://example.com/a.png']
      })
    ).toEqual({
      model: 'nano-banana-pro',
      prompt: 'edit the background',
      image_urls: ['https://example.com/a.png'],
      resolution: '1K',
      action: 'edit',
      async: true
    });
  });

  it.each(GPT_IMAGE_25_MODELS)('preserves the exact GPT Image 2.5 model in generation requests: %s', (model) => {
    expect(
      buildOpenAIImageGenerateRequest({
        model,
        prompt: '  draw a cat  ',
        size: '2048x1152',
        quality: 'high'
      })
    ).toEqual({
      model,
      prompt: 'draw a cat',
      size: '2048x1152',
      quality: 'high',
      action: 'generate',
      async: true
    });
  });

  it('preserves quality without mutating the source config', () => {
    const config = {
      model: 'gpt-image-2.5-sunburst:official',
      prompt: '  draw a detailed portrait  ',
      quality: 'medium' as const
    };

    expect(buildOpenAIImageGenerateRequest(config)).toEqual({
      model: 'gpt-image-2.5-sunburst:official',
      prompt: 'draw a detailed portrait',
      quality: 'medium',
      action: 'generate',
      async: true
    });
    expect(config.prompt).toBe('  draw a detailed portrait  ');
  });

  it('builds a trimmed GPT Image generation payload without edit images', () => {
    expect(
      buildOpenAIImageGenerateRequest({
        model: 'gpt-image-2',
        prompt: '  draw a cat  ',
        image_urls: ['https://example.com/reference.png'],
        size: ''
      })
    ).toEqual({
      model: 'gpt-image-2',
      prompt: 'draw a cat',
      action: 'generate',
      async: true
    });
  });
});
