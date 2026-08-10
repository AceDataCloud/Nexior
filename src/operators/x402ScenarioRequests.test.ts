import { describe, expect, it } from 'vitest';
import { buildFluxRequest } from './flux';
import { buildQrartRequest } from './qrart';
import { buildLumaRequest } from './luma';
import { buildPikaRequest } from './pika';
import { buildPixverseRequest } from './pixverse';
import { buildHailuoRequest } from './hailuo';
import { buildVeoRequest } from './veo';
import { buildSeedanceRequest } from './seedance';
import { buildSoraRequest } from './sora';
import { buildWanRequest } from './wan';
import { buildOmniRequest } from './omni';
import { buildGrokVideoRequest } from './grokvideo';
import { buildMinimaxRequest } from './minimax';
import { buildMaestroRequest } from './maestro';

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

  it.each([
    ['luma', buildLumaRequest, { prompt: 'video', enhancement: true, loop: true }],
    ['pika', buildPikaRequest, { model: 'pika-2.2', prompt: 'video', ingredients: true }],
    ['pixverse', buildPixverseRequest, { model: 'v4.5', duration: 8, quality: '1080p' }],
    ['hailuo', buildHailuoRequest, { model: 'MiniMax-Hailuo-02', prompt: 'video' }],
    ['sora', buildSoraRequest, { model: 'sora-2', duration: 12, size: '1280x720' }],
    ['wan', buildWanRequest, { model: 'wan2.6-i2v', duration: 10, resolution: '1080p' }]
  ])('preserves %s pricing inputs and enables async mode', (_scenario, builder, config) => {
    expect(builder(config as never)).toMatchObject({ ...config, async: true });
  });

  it('uses the existing Veo action normalizer for quote and submit payloads', () => {
    expect(buildVeoRequest({ action: 'ingredients2video', image_urls: ['a', 'b', 'c', 'd'] })).toMatchObject({
      action: 'ingredients2video',
      model: 'veo31-fast-ingredients',
      image_urls: ['a', 'b', 'c'],
      async: true
    });
  });

  it('folds Seedance audio and video references into the native content array', () => {
    expect(
      buildSeedanceRequest({
        model: 'seedance-2.0',
        prompt: '  animate  ',
        images: [{ role: 'reference_image', url: 'https://example.com/image.png' }],
        audios: [{ url: 'https://example.com/audio.mp3' }],
        videos: [{ url: 'https://example.com/video.mp4' }],
        async: true
      })
    ).toMatchObject({
      model: 'seedance-2.0',
      async: true,
      content: [
        { type: 'text', text: 'animate' },
        { type: 'image_url', role: 'reference_image' },
        { type: 'audio_url' },
        { type: 'video_url' }
      ]
    });
  });

  it('cleans Omni and Grok reference inputs without losing pricing fields', () => {
    expect(
      buildOmniRequest({
        model: 'veo-3.1-generate-preview',
        prompt: '  animate  ',
        image_urls: ['', 'https://example.com/image.png'],
        video_urls: [],
        resolution: '1080p'
      })
    ).toEqual({
      model: 'veo-3.1-generate-preview',
      prompt: 'animate',
      image_urls: ['https://example.com/image.png'],
      resolution: '1080p',
      async: true
    });
    expect(
      buildGrokVideoRequest({
        model: 'grok-imagine-video-1.5:official',
        prompt: '  animate  ',
        image_url: 'https://example.com/image.png',
        reference_image_urls: ['https://example.com/reference.png'],
        duration: 15,
        resolution: '1080p'
      })
    ).toEqual({
      model: 'grok-imagine-video-1.5:official',
      prompt: 'animate',
      image_url: 'https://example.com/image.png',
      duration: 15,
      resolution: '1080p',
      async: true
    });
  });

  it('preserves native MiniMax and Maestro wire contracts', () => {
    expect(
      buildMinimaxRequest({
        model: 'MiniMax-H3',
        content: [{ type: 'text', text: 'video' }],
        resolution: '2K',
        duration: 10
      })
    ).not.toHaveProperty('async');
    expect(
      buildMaestroRequest({
        prompt: 'video',
        duration: 30,
        quality: 'pro',
        scenario_customization_enabled: true,
        scenario: 'drama'
      })
    ).toMatchObject({ prompt: 'video', duration: 30, quality: 'pro', scenario: 'drama' });
  });
});
