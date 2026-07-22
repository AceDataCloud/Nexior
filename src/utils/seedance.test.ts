import { describe, expect, it } from 'vitest';

import { normalizeSeedanceRequest } from './seedance';
import {
  SEEDANCE_MODEL_1_0_PRO,
  SEEDANCE_MODEL_2_0_FAST,
  SEEDANCE_MODEL_1_0_LITE_T2V,
  SEEDANCE_MODEL_1_0_LITE_I2V
} from '@/constants';

describe('normalizeSeedanceRequest', () => {
  it('talking mode routes a first_frame image to reference_image and forces audio', () => {
    const { request, reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      talking: true,
      camerafixed: true,
      prompt: '图片1中的角色说"你好"',
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]
    });

    expect(reject).toBeUndefined();
    expect(request?.images).toEqual([{ url: 'https://cdn.example.com/a.jpg', role: 'reference_image' }]);
    expect(request?.generate_audio).toBe(true);
    // camera_fixed is rejected upstream on the 2.0 i2v/r2v path.
    expect(request).not.toHaveProperty('camerafixed');
    // The UI-only flag must never reach the API.
    expect(request).not.toHaveProperty('talking');
    expect(request?.async).toBe(true);
  });

  it('strips the talking flag and leaves image role untouched when talking is off', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      talking: false,
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]
    });

    expect(request).not.toHaveProperty('talking');
    expect(request?.images).toEqual([{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]);
  });

  it('does not create a reference_image on a model that cannot accept one', () => {
    const { request, reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_1_0_PRO,
      talking: true,
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]
    });

    expect(reject).toBeUndefined();
    // 1.0 Pro is not reference-capable, so the image stays a first_frame.
    expect(request?.images).toEqual([{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }]);
    expect(request).not.toHaveProperty('talking');
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

  it('drops reference audio without a paired reference image via rejection', () => {
    const { reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      audios: [{ url: 'https://cdn.example.com/voice.mp3' }]
    });
    expect(reject).toBe('audioRequiresReferenceImage');
  });

  it('rejects talking mode when no image is uploaded', () => {
    const { request, reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      talking: true,
      prompt: '图片1中的角色说"你好"'
    });
    // Without a portrait the r2v path yields a silent clip — the exact failure
    // talking mode exists to prevent — so it must reject, not submit.
    expect(request).toBeUndefined();
    expect(reject).toBe('talkingRequiresReferenceImage');
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

  it('never sends the flex service tier', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      prompt: 'a cat',
      service_tier: 'flex'
    });
    expect(request).not.toHaveProperty('service_tier');
  });
});
