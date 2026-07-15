import { describe, expect, it } from 'vitest';
import { buildVeoGenerateRequest, normalizeVeoConfigForAction, VEO_INGREDIENTS_MODEL } from './config';

describe('normalizeVeoConfigForAction', () => {
  it('clears references and repairs the ingredients-only model for text-to-video', () => {
    expect(
      normalizeVeoConfigForAction(
        { action: 'ingredients2video', model: VEO_INGREDIENTS_MODEL, image_urls: ['one', 'two', 'three'] },
        'text2video'
      )
    ).toEqual({ action: 'text2video', model: 'veo31-fast' });
  });

  it('keeps at most two frames and a general model for image-to-video', () => {
    expect(
      normalizeVeoConfigForAction({ model: VEO_INGREDIENTS_MODEL, image_urls: ['one', 'two', 'three'] }, 'image2video')
    ).toEqual({ action: 'image2video', model: 'veo31-fast', image_urls: ['one', 'two'] });
  });

  it('locks multi-image fusion to its dedicated model and keeps up to three references', () => {
    expect(
      normalizeVeoConfigForAction(
        { model: 'veo3-fast', image_urls: ['one', 'two', 'three', 'four'] },
        'ingredients2video'
      )
    ).toEqual({
      action: 'ingredients2video',
      model: VEO_INGREDIENTS_MODEL,
      image_urls: ['one', 'two', 'three']
    });
  });

  it('clears references when switching between image modes', () => {
    expect(
      normalizeVeoConfigForAction(
        { action: 'image2video', model: 'veo31-fast', image_urls: ['start', 'end'] },
        'ingredients2video'
      )
    ).toEqual({
      action: 'ingredients2video',
      model: VEO_INGREDIENTS_MODEL
    });
  });
});

describe('buildVeoGenerateRequest', () => {
  it('omits empty image arrays from the API payload', () => {
    expect(buildVeoGenerateRequest({ action: 'image2video', image_urls: [] })).toEqual({
      action: 'image2video',
      model: 'veo31-fast',
      async: true
    });
  });
});
