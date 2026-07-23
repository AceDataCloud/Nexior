import { describe, expect, it } from 'vitest';

import { normalizeSeedanceRequest } from './seedance';
import {
  SEEDANCE_MODEL_1_0_PRO,
  SEEDANCE_MODEL_2_0_FAST,
  SEEDANCE_MODEL_1_0_LITE_T2V,
  SEEDANCE_MODEL_1_0_LITE_I2V
} from '@/constants';

describe('normalizeSeedanceRequest', () => {
  it('keeps a first_frame image as-is and sends async', () => {
    const { request, reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      prompt: 'a cat',
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]
    });
    expect(reject).toBeUndefined();
    expect(request?.images).toEqual([{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]);
    expect(request?.async).toBe(true);
  });

  it('promotes a lone last_frame image to first_frame', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'last_frame' }]
    });
    expect(request?.images).toEqual([{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]);
  });

  it('rejects an unknown model', () => {
    const { reject } = normalizeSeedanceRequest({ model: 'doubao-does-not-exist', prompt: 'hi' });
    expect(reject).toBe('modelUnsupported');
  });

  it('rejects an image on a text-only model', () => {
    const { reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_1_0_LITE_T2V,
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]
    });
    expect(reject).toBe('modelRejectsImage');
  });

  it('strips a reference_image on a non-2.0 model instead of sending it', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_1_0_PRO,
      prompt: 'a cat',
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'reference_image' }]
    });
    // 1.0 Pro has no multimodal reference; the stray reference_image is dropped.
    expect(request?.images).toBeUndefined();
  });

  it('rejects a required-image model when its only image is a stripped reference_image', () => {
    // 1.0 Lite i2v requires an image but rejects reference_image; the reference
    // image is removed, so the request would be image-less → must reject, not 400.
    const { request, reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_1_0_LITE_I2V,
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'reference_image' }]
    });
    expect(request).toBeUndefined();
    expect(reject).toBe('modelRequiresImage');
  });

  it('rejects reference audio with no paired image or video', () => {
    // Official combos are image+audio / video+audio / image+video+audio;
    // audio-only (and text+audio) are rejected upstream.
    const { reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      audios: [{ url: 'https://cdn.example.com/voice.mp3' }]
    });
    expect(reject).toBe('audioRequiresReference');
  });

  it('accepts reference audio when paired with a reference image', () => {
    const { request, reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      prompt: '角色说{你好}',
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'reference_image' }],
      audios: [{ url: 'https://cdn.example.com/voice.mp3' }]
    });
    expect(reject).toBeUndefined();
    expect(request?.audios).toEqual([{ url: 'https://cdn.example.com/voice.mp3' }]);
  });

  it('never sends the flex service tier', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      prompt: 'a cat',
      service_tier: 'flex'
    });
    expect(request).not.toHaveProperty('service_tier');
  });
});
