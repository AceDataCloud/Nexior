import { describe, expect, it } from 'vitest';
import { canSubmitGeneration, getGenerationInputError, type GenerationInputService } from './generationInput';

describe('generation input contracts', () => {
  it.each<GenerationInputService>(['flux', 'maestro', 'nanobanana', 'qrart', 'qwenimage', 'seedream'])(
    '%s always requires meaningful prompt text',
    (service) => {
      expect(getGenerationInputError(service, { prompt: ' \n ' })).toBe('promptRequired');
      expect(canSubmitGeneration(service, { prompt: ' create something ' })).toBe(true);
    }
  );

  it('accepts any meaningful Producer generation input', () => {
    expect(getGenerationInputError('producer', {})).toBe('generationInputRequired');
    for (const key of ['prompt', 'lyric', 'lyric_prompt', 'style', 'title', 'audio_id']) {
      expect(canSubmitGeneration('producer', { [key]: ' value ' })).toBe(true);
      expect(canSubmitGeneration('producer', { [key]: '   ' })).toBe(false);
    }
  });

  it('validates Veo text and image actions separately', () => {
    expect(getGenerationInputError('veo', { action: 'text2video' })).toBe('promptRequired');
    expect(canSubmitGeneration('veo', { action: 'text2video', prompt: 'video' })).toBe(true);
    expect(getGenerationInputError('veo', { action: 'image2video' })).toBe('generationInputRequired');
    expect(canSubmitGeneration('veo', { action: 'image2video', image_urls: ['image'] })).toBe(true);
  });

  it('validates Sora text and image actions separately', () => {
    expect(getGenerationInputError('sora', {})).toBe('promptRequired');
    expect(canSubmitGeneration('sora', { prompt: 'video' })).toBe(true);
    expect(getGenerationInputError('sora', { action: 'image2video' })).toBe('generationInputRequired');
    expect(canSubmitGeneration('sora', { action: 'image2video', image_urls: ['image'] })).toBe(true);
  });

  it.each([
    ['hailuo', { first_image_url: 'image' }],
    ['hailuo', { video_url: 'video' }],
    ['pixverse', { image_url: 'image' }],
    ['pika', { image_url: ['image'] }],
    ['wan', { image_url: 'image' }],
    ['wan', { media: [{ type: 'image', url: 'image' }] }]
  ] as const)('%s accepts its media-only mode', (service, request) => {
    expect(canSubmitGeneration(service, request)).toBe(true);
    expect(canSubmitGeneration(service, {})).toBe(false);
  });

  it.each([
    ['veo', { action: 'image2video', image_urls: [''] }],
    ['sora', { action: 'image2video', image_urls: ['  '] }],
    ['pika', { image_url: [''] }],
    ['wan', { media: [{ type: 'image', url: '' }] }],
    ['seedance', { images: [{ url: '' }] }]
  ] as const)('%s rejects media arrays without a meaningful URL', (service, request) => {
    expect(getGenerationInputError(service, request)).toBe('generationInputRequired');
  });

  it('requires Pika media for effect and ingredients modes', () => {
    expect(getGenerationInputError('pika', { effect: 'effect' })).toBe('generationInputRequired');
    expect(canSubmitGeneration('pika', { effect: 'effect', image_url: ['image'] })).toBe(true);
    expect(getGenerationInputError('pika', { ingredients: true })).toBe('generationInputRequired');
    expect(canSubmitGeneration('pika', { ingredients: true, image_url: ['image'] })).toBe(true);
  });

  it('requires prompts only for Kling text-to-video', () => {
    expect(getGenerationInputError('kling', { action: 'text2video' })).toBe('promptRequired');
    expect(canSubmitGeneration('kling', { action: 'text2video', prompt: 'video' })).toBe(true);
    expect(getGenerationInputError('kling', { action: 'image2video' })).toBe('generationInputRequired');
    expect(canSubmitGeneration('kling', { action: 'image2video', start_image_url: 'image' })).toBe(true);
    expect(getGenerationInputError('kling', { action: 'extend' })).toBe('generationInputRequired');
    expect(canSubmitGeneration('kling', { action: 'extend', video_id: 'video' })).toBe(true);
    expect(canSubmitGeneration('kling', { action: 'extend', video_url: 'video' })).toBe(true);
    expect(canSubmitGeneration('kling', { action: 'text2video', image_list: [{ image_url: 'image' }] })).toBe(true);
    expect(canSubmitGeneration('kling', { action: 'text2video', video_list: [{ video_url: 'video' }] })).toBe(true);
    expect(getGenerationInputError('kling', { action: 'text2video', image_list: [{ image_url: ' ' }] })).toBe(
      'promptRequired'
    );
  });

  it('accepts any normalized Seedance content but rejects an empty request', () => {
    expect(getGenerationInputError('seedance', {})).toBe('generationInputRequired');
    for (const value of [
      { prompt: 'video' },
      { images: [{ url: 'image' }] },
      { videos: [{ url: 'video' }] },
      { audios: [{ url: 'audio' }] }
    ]) {
      expect(canSubmitGeneration('seedance', value)).toBe(true);
    }
  });

  it('keeps Midjourney Describe outside prompt validation', () => {
    expect(getGenerationInputError('midjourney-imagine', { prompt: '  ' })).toBe('promptRequired');
    expect(getGenerationInputError('midjourney-videos', { prompt: '' })).toBe('promptRequired');
    expect(canSubmitGeneration('midjourney-imagine', { prompt: 'https://reference.example/image.png' })).toBe(true);
  });
});
