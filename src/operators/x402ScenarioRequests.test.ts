import { describe, expect, it } from 'vitest';
import { buildFluxRequest } from './flux';
import { buildQrartRequest } from './qrart';

describe('scenario-owned x402 requests', () => {
  it('preserves selected Flux pricing parameters', () => {
    expect(
      buildFluxRequest({
        action: 'edits',
        model: 'flux-kontext-pro',
        prompt: '  edit this  ',
        image_url: 'https://example.com/a.png',
        count: 3,
        quality: 90,
        size: '1024x1024'
      })
    ).toEqual({
      action: 'edits',
      model: 'flux-kontext-pro',
      prompt: 'edit this',
      image_url: 'https://example.com/a.png',
      count: 3,
      quality: 90,
      size: '1024x1024',
      async: true
    });
  });

  it('preserves QR Art basic and advanced pricing parameters', () => {
    expect(
      buildQrartRequest({
        type: 'link',
        content: 'https://example.com',
        prompt: 'tacos',
        aspect_ratio: '1:1',
        advanced: true,
        steps: 20,
        padding_noise: 0.2
      })
    ).toMatchObject({
      type: 'link',
      content: 'https://example.com',
      prompt: 'tacos',
      aspect_ratio: '1:1',
      steps: 20,
      padding_noise: 0.2,
      async: true
    });
  });
});
