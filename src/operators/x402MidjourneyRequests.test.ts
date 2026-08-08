import { describe, expect, it, vi } from 'vitest';
import {
  buildMidjourneyCustomRequest,
  buildMidjourneyDescribeRequest,
  buildMidjourneyImagineRequest,
  buildMidjourneyVideosRequest,
  midjourneyOperator
} from './midjourney';
import { MidjourneyImagineAction, MidjourneyVideosAction } from '@/models';

const x402 = vi.hoisted(() => ({ quote: vi.fn(), post: vi.fn() }));
vi.mock('./x402', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./x402')>()),
  quoteX402: x402.quote,
  postWithX402: x402.post
}));

describe('Midjourney x402 requests', () => {
  it('builds one authoritative imagine prompt with V8 pricing flags', () => {
    expect(
      buildMidjourneyImagineRequest({
        type: 'imagine',
        prompt: 'cat',
        references: ['https://example.com/ref.png'],
        model: 'v8',
        version: '8',
        hd: true,
        quality: '2',
        advanced: true,
        chaos: 10,
        ratio: '16:9'
      })
    ).toMatchObject({
      action: MidjourneyImagineAction.GENERATE,
      version: '8',
      hd: true,
      quality: '2',
      moodboard: true,
      async: true,
      prompt: expect.stringContaining('cat --v8 --version 8 --chaos 10 --quality 2 --aspect 16:9 --hd')
    });
  });

  it('builds custom, videos, and describe payloads without crossing endpoints', () => {
    expect(
      buildMidjourneyCustomRequest(
        { version: '8.1', mode: 'relax', quality: '2' },
        { image_id: 'image-1', action: MidjourneyImagineAction.UPSCALE1 }
      )
    ).toEqual({
      image_id: 'image-1',
      action: MidjourneyImagineAction.UPSCALE1,
      mode: 'fast',
      async: true,
      version: '8.1',
      hd: false
    });
    expect(buildMidjourneyVideosRequest({ action: 'extend', video_id: 'video-1', resolution: '720p' })).toMatchObject({
      action: MidjourneyVideosAction.EXTEND,
      video_id: 'video-1',
      resolution: '720p',
      async: true
    });
    expect(buildMidjourneyDescribeRequest({ image_url: 'image.png' })).toEqual({ image_url: 'image.png' });
  });

  it('routes each quote and signed submit to its exact endpoint', async () => {
    x402.quote.mockResolvedValue({ amountUsdc: '1' });
    x402.post.mockResolvedValue({ data: { task_id: 'task-1' } });
    const options = { mode: 'x402' as const, x402: { wallet: {} as never, confirm: async () => true } };
    const imagine = buildMidjourneyImagineRequest({ prompt: 'cat' });
    const videos = buildMidjourneyVideosRequest({ image_url: 'image.png' });
    const describe = buildMidjourneyDescribeRequest({ image_url: 'image.png' });

    await midjourneyOperator.quoteImagine(imagine);
    await midjourneyOperator.quoteVideos(videos);
    await midjourneyOperator.quoteDescribe(describe);
    await midjourneyOperator.imagine(imagine, options);
    await midjourneyOperator.videos(videos, options);
    await midjourneyOperator.describe(describe, options);

    expect(x402.quote.mock.calls.map((call) => call[0])).toEqual([
      '/midjourney/imagine',
      '/midjourney/videos',
      '/midjourney/describe'
    ]);
    expect(x402.post.mock.calls.map((call) => call[0])).toEqual([
      '/midjourney/imagine',
      '/midjourney/videos',
      '/midjourney/describe'
    ]);
  });
});
