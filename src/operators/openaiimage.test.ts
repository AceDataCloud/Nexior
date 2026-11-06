// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('axios', () => ({ default: { post: mocks.post } }));

import { openaiimageOperator } from './openaiimage';

describe('OpenAIImageOperator edit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockResolvedValue({ data: { success: true, task_id: 'task-1' } });
  });

  it('includes quality in the multipart edit request', async () => {
    await openaiimageOperator.edit(
      {
        model: 'gpt-image-2.5-sunburst:official',
        prompt: 'edit the portrait',
        size: '2448x3264',
        quality: 'max',
        async: true,
        image_urls: ['https://example.com/a.png', 'https://example.com/b.png']
      },
      { token: 'credential-token' }
    );

    const form = mocks.post.mock.calls[0][1] as FormData;
    expect(Array.from(form.entries())).toEqual([
      ['model', 'gpt-image-2.5-sunburst:official'],
      ['prompt', 'edit the portrait'],
      ['size', '2448x3264'],
      ['quality', 'max'],
      ['async', 'true'],
      ['image', 'https://example.com/a.png'],
      ['image', 'https://example.com/b.png']
    ]);
  });

  it('does not append an undefined quality', async () => {
    await openaiimageOperator.edit(
      { model: 'gpt-image-2.5-flare', prompt: 'edit', image_urls: ['https://example.com/a.png'] },
      { token: 'credential-token' }
    );

    const form = mocks.post.mock.calls[0][1] as FormData;
    expect(form.has('quality')).toBe(false);
  });

  it('preserves GIF controls in multipart edits', async () => {
    await openaiimageOperator.edit(
      {
        model: 'gpt-image-2.6-flare',
        prompt: 'animate',
        size: '512x512',
        output_format: 'gif',
        frame_count: 9,
        frame_duration_ms: 200,
        image_urls: ['https://example.com/a.png']
      },
      { token: 'credential-token' }
    );
    const form = mocks.post.mock.calls[0][1] as FormData;
    expect(form.get('output_format')).toBe('gif');
    expect(form.get('frame_count')).toBe('9');
    expect(form.get('frame_duration_ms')).toBe('200');
    expect(form.get('image')).toBe('https://example.com/a.png');
  });
  it('sends complexity and markup with static reference edits', async () => {
    await openaiimageOperator.edit(
      {
        model: 'gpt-image-2.6-sunburst',
        prompt: 'edit annotation',
        image_urls: ['https://example.com/base.png'],
        complexity: 'low',
        markup: 'https://example.com/overlay.png'
      },
      { token: 'fixture' }
    );
    const form = mocks.post.mock.calls[0][1] as FormData;
    expect(form.get('complexity')).toBe('low');
    expect(form.get('markup')).toBe('https://example.com/overlay.png');
  });
});
