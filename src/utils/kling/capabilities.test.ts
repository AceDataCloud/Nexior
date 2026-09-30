import { describe, expect, it } from 'vitest';
import { clearKlingConflicts, findKlingConflicts, getKlingCapabilities } from './capabilities';

describe('Kling Omni capabilities', () => {
  it('exposes reference video for the canonical model name', () => {
    expect(getKlingCapabilities('kling-o1').referenceVideo).toBe(true);
  });

  it('exposes image and video references for V3 Omni', () => {
    expect(getKlingCapabilities('kling-v3-omni')).toMatchObject({
      referenceImages: true,
      referenceVideo: true
    });
  });

  it('clears prompt controls when switching to O1', () => {
    const config = {
      model: 'kling-v3',
      cfg_scale: 0.5,
      negative_prompt: 'blur',
      camera_control: { type: 'simple' }
    };
    const conflicts = findKlingConflicts(config, { model: 'kling-o1' });
    expect(conflicts.map(({ field }) => field)).toEqual(['camera_control', 'cfg_scale', 'negative_prompt']);
    expect(clearKlingConflicts({ ...config, model: 'kling-o1' }, conflicts)).toMatchObject({
      camera_control: undefined,
      cfg_scale: undefined,
      negative_prompt: undefined
    });
  });
});

it('offers native audio and clears unsupported controls when switching to Turbo', () => {
  expect(getKlingCapabilities('kling-v3-turbo')).toMatchObject({
    audio: true,
    endImage: false,
    motionControl: false,
    referenceImages: false,
    referenceVideo: false
  });
  const conflicts = findKlingConflicts(
    {
      end_image_url: 'https://example.com/a.png',
      cfg_scale: 0,
      negative_prompt: 'blur',
      camera_control: { type: 'simple' },
      image_list: [{ image_url: 'https://example.com/b.png' }],
      video_list: [{ video_url: 'https://example.com/v.mp4' }]
    },
    { model: 'kling-v3-turbo' }
  );
  expect(conflicts.map((c) => c.field)).toEqual([
    'end_image_url',
    'camera_control',
    'video_list',
    'image_list',
    'cfg_scale',
    'negative_prompt'
  ]);
});
