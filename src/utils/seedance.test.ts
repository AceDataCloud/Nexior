import { describe, expect, it } from 'vitest';

import { normalizeSeedanceRequest } from './seedance';
import { buildSeedanceRequest } from '@/operators/seedance';
import {
  SEEDANCE_MODEL_1_0_PRO,
  SEEDANCE_MODEL_2_5,
  SEEDANCE_MODEL_2_0_FAST,
  SEEDANCE_MODEL_1_0_LITE_T2V,
  SEEDANCE_MODEL_1_0_LITE_I2V
} from '@/constants';

describe('buildSeedanceRequest', () => {
  it('adds required roles to reference audio and video', () => {
    const request = buildSeedanceRequest({ audios: [{ url: 'a.mp3' }], videos: [{ url: 'v.mp4' }] });
    expect(request.content).toEqual([
      { type: 'audio_url', role: 'reference_audio', audio_url: { url: 'a.mp3' } },
      { type: 'video_url', role: 'reference_video', video_url: { url: 'v.mp4' } }
    ]);
  });
});

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

  it('keeps a legal first frame for Seedance 1.0 Pro', () => {
    const { request, reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_1_0_PRO,
      prompt: 'animate',
      images: [{ url: 'https://cdn.example.com/frame.jpg', role: 'first_frame' }]
    });
    expect(reject).toBeUndefined();
    expect(request?.images).toHaveLength(1);
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

  it('accepts pure reference audio for Seedance 2.5', () => {
    const { request, reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_5,
      prompt: 'follow the rhythm',
      audios: [{ url: 'https://cdn.example.com/voice.mp3' }],
      duration: 30,
      output_format: 'mov'
    });
    expect(reject).toBeUndefined();
    expect(request?.duration).toBe(30);
    expect(request?.output_format).toBe('mov');
  });

  it('enforces Seedance 2.5 edit request constraints', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_5,
      prompt: 'replace the sky',
      videos: [{ url: 'https://cdn.example.com/input.mp4' }],
      ratio: '16:9',
      duration: 10,
      omni_reference_task_type: 'edit'
    });
    expect(request?.ratio).toBe('adaptive');
    expect(request?.duration).toBe(-1);
  });

  it('normalizes Seedance 2.5 frame, roles, and web search controls', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_5,
      prompt: 'animate',
      ratio: '16:9',
      images: [{ url: 'https://cdn.example.com/a.jpg', role: 'first_frame' }],
      audios: [{ url: 'https://cdn.example.com/a.mp3' }],
      videos: [{ url: 'https://cdn.example.com/v.mp4' }],
      web_search: true
    });
    expect(request?.ratio).toBe('adaptive');
    expect(request?.tools).toEqual([{ type: 'web_search' }]);
  });

  it('requires a reference video for Seedance 2.5 edit and extend', () => {
    const { reject } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_5,
      prompt: 'edit this',
      omni_reference_task_type: 'edit'
    });
    expect(reject).toBe('taskRequiresVideo');
  });

  it('strips Seedance 2.5-only options from 2.0', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      prompt: 'a cat',
      output_format: 'mov',
      omni_reference_task_type: 'auto'
    });
    expect(request).not.toHaveProperty('output_format');
    expect(request).not.toHaveProperty('omni_reference_task_type');
  });

  it('never sends the flex service tier', () => {
    const { request } = normalizeSeedanceRequest({
      model: SEEDANCE_MODEL_2_0_FAST,
      prompt: 'a cat',
      ...({ service_tier: 'flex' } as any)
    });
    expect(request).not.toHaveProperty('service_tier');
  });
});

describe('generation input requirement', () => {
  it('rejects a normalized request with neither prompt nor media', () => {
    expect(normalizeSeedanceRequest({ model: 'doubao-seedance-2-0-260128' })).toEqual({
      reject: 'generationInputRequired'
    });
  });

  it('rejects whitespace-only media URLs after normalization', () => {
    expect(
      normalizeSeedanceRequest({
        model: 'doubao-seedance-2-0-260128',
        images: [{ url: '   ', role: 'first_frame' }],
        videos: [{ url: '\t' }],
        audios: [{ url: '\n' }]
      })
    ).toEqual({ reject: 'generationInputRequired' });
  });

  it('keeps valid prompt and media-only requests', () => {
    expect(normalizeSeedanceRequest({ model: 'doubao-seedance-2-0-260128', prompt: ' video ' }).request?.prompt).toBe(
      'video'
    );
    expect(
      normalizeSeedanceRequest({
        model: 'doubao-seedance-2-0-260128',
        images: [{ url: 'https://cdn.example/frame.png', role: 'first_frame' }]
      }).request?.images
    ).toHaveLength(1);
  });
});
