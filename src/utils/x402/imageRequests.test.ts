import { describe, expect, it } from 'vitest';
import { buildNanobananaRequest, buildOpenAIImageGenerateRequest } from './imageRequests';

describe('x402 image request builders', () => {
  it('builds the same Nano Banana payload for quote and generation', () => {
    expect(
      buildNanobananaRequest({
        model: 'nano-banana-2',
        prompt: 'banana',
        image_urls: [],
        aspect_ratio: '',
        resolution: ''
      })
    ).toEqual({
      model: 'nano-banana-2',
      prompt: 'banana',
      resolution: '1K',
      action: 'generate',
      async: true
    });

    expect(buildNanobananaRequest({ model: 'nano-banana-pro', image_urls: ['https://example.com/a.png'] })).toEqual({
      model: 'nano-banana-pro',
      image_urls: ['https://example.com/a.png'],
      resolution: '1K',
      action: 'edit',
      async: true
    });
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
