import { describe, expect, it, vi } from 'vitest';
import { buildProducerAudioRequest, producerOperator } from './producer';

const x402 = vi.hoisted(() => ({ quote: vi.fn(), post: vi.fn() }));
vi.mock('./x402', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./x402')>()),
  quoteX402: x402.quote,
  postWithX402: x402.post
}));

describe('Producer x402 requests', () => {
  it('builds the audio request without persisted preview data', () => {
    expect(
      buildProducerAudioRequest({
        action: 'generate',
        model: 'producer-v1',
        prompt: 'song',
        custom: true,
        audio: { id: 'preview-only' },
        continue_at: 12
      })
    ).toEqual({
      action: 'generate',
      model: 'producer-v1',
      prompt: 'song',
      custom: true,
      audio: undefined,
      continue_at: 12,
      async: true
    });
  });

  it('routes audio, lyrics, and wav quotes/submits independently', async () => {
    x402.quote.mockResolvedValue({ amountUsdc: '1' });
    x402.post.mockResolvedValue({ data: { task_id: 'task-1' } });
    const options = { mode: 'x402' as const, x402: { wallet: {} as never, confirm: async () => true } };

    await producerOperator.quoteAudio({ prompt: 'song' });
    await producerOperator.quoteLyric({ prompt: 'lyrics' });
    await producerOperator.quoteWav({ audio_id: 'audio-1' });
    await producerOperator.quoteVideo({ audio_id: 'audio-1' });
    await producerOperator.audio({ prompt: 'song' }, options);
    await producerOperator.lyric({ prompt: 'lyrics' }, options);
    await producerOperator.wav({ audio_id: 'audio-1' }, options);
    await producerOperator.video({ audio_id: 'audio-1' }, options);

    expect(x402.quote.mock.calls.map((call) => call[0])).toEqual([
      '/producer/audios',
      '/producer/lyrics',
      '/producer/wav',
      '/producer/videos'
    ]);
    expect(x402.post.mock.calls.map((call) => call[0])).toEqual([
      '/producer/audios',
      '/producer/lyrics',
      '/producer/wav',
      '/producer/videos'
    ]);
  });
});
