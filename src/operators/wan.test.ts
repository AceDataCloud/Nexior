import { describe, expect, it } from 'vitest';
import { buildWanRequest } from './wan';

describe('buildWanRequest wan3', () => {
  it('normalizes TYPE=URL lines into media objects', () => {
    const request = buildWanRequest({
      model: 'wan3.0-video',
      prompt: 'use image 1',
      media_text: 'reference_image=https://example.com/a.png\nreference_audio=https://example.com/a.mp3'
    });
    expect(request.media).toEqual([
      { type: 'reference_image', url: 'https://example.com/a.png' },
      { type: 'reference_audio', url: 'https://example.com/a.mp3' }
    ]);
    expect(request).not.toHaveProperty('media_text');
    expect(request).not.toHaveProperty('action');
    expect(request.async).toBe(true);
  });
});
