import { expect, it } from 'vitest';
import { buildKlingVideoRequest } from './kling';

it('submits fixed Turbo audio and removes stale unsupported controls without mutating saved config', () => {
  const config = {
    model: 'kling-v3-turbo',
    prompt: ' ocean ',
    duration: 7,
    mode: 'pro',
    generate_audio: false,
    cfg_scale: 0,
    negative_prompt: 'blur',
    camera_control: { type: 'simple' as const },
    end_image_url: 'tail',
    image_list: [{ image_url: 'https://example.com/ref.png' }]
  };
  const request = buildKlingVideoRequest(config);
  expect(request).toMatchObject({
    model: 'kling-v3-turbo',
    prompt: 'ocean',
    duration: 7,
    mode: 'pro',
    generate_audio: true,
    action: 'text2video'
  });
  for (const field of ['end_image_url', 'negative_prompt', 'cfg_scale', 'camera_control', 'image_list', 'video_list'])
    expect(request).not.toHaveProperty(field);
  expect(config.generate_audio).toBe(false);
  expect(config.cfg_scale).toBe(0);
});
