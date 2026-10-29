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
        quality: 'high',
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
      ['quality', 'high'],
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
});

describe('OpenAIImageOperator task summaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.post.mockResolvedValue({ data: { items: [], count: 0 } });
  });

  it('requests summaries for paged history and pending ids', async () => {
    await openaiimageOperator.tasks({ userId: 'user-1', limit: 20 }, { token: 'test-token' });
    expect(mocks.post.mock.calls[0][1]).toEqual({
      action: 'retrieve_batch',
      user_id: 'user-1',
      limit: 20,
      view: 'summary'
    });
    await openaiimageOperator.tasks({ ids: ['task-1'] }, { token: 'test-token' });
    expect(mocks.post.mock.calls[1][1]).toEqual({ action: 'retrieve_batch', ids: ['task-1'], view: 'summary' });
  });

  it('keeps single-task retrieval full', async () => {
    await openaiimageOperator.task('task-1', { token: 'test-token' });
    expect(mocks.post.mock.calls[0][1]).toEqual({ action: 'retrieve', id: 'task-1' });
  });
});
