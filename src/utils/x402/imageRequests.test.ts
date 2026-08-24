import { describe, expect, it } from 'vitest';
import { buildNanobananaRequest, buildOpenAIImageGenerateRequest } from './imageRequests';

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
