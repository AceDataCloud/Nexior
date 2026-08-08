import { describe, expect, it, vi } from 'vitest';
import { buildSunoAudioRequest, sunoOperator } from './suno';

const x402 = vi.hoisted(() => ({ quote: vi.fn(), post: vi.fn() }));
vi.mock('./x402', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./x402')>()),
  quoteX402: x402.quote,
  postWithX402: x402.post
}));

describe('Suno x402 requests', () => {
  it('builds the main audio request without preview-only audio state', () => {
    expect(
      buildSunoAudioRequest({ prompt: '  song  ', model: 'chirp-v5', audio: { id: 'preview' }, continue_at: 12 })
    ).toEqual({ prompt: 'song', model: 'chirp-v5', audio: undefined, continue_at: 12, async: true });
  });

  it('routes all UI-used exact writes independently', async () => {
    x402.quote.mockResolvedValue({ amountUsdc: '1' });
    x402.post.mockResolvedValue({ data: { task_id: 'task-1' } });
    const options = { mode: 'x402' as const, x402: { wallet: {} as never, confirm: async () => true } };

    await sunoOperator.quoteAudio({ prompt: 'song' });
    await sunoOperator.audio({ prompt: 'song' }, options);
    await sunoOperator.lyric({ prompt: 'lyrics' }, options);
    await sunoOperator.style({ prompt: 'style' }, options);
    await sunoOperator.wav({ audio_id: 'audio-1' }, options);
    await sunoOperator.midi({ audio_id: 'audio-1' }, options);
    await sunoOperator.persona({ audio_id: 'audio-1', name: 'voice' }, options);
    await sunoOperator.voices({ audio_url: 'voice.mp3' }, options);
    await sunoOperator.vox({ audio_id: 'audio-1', async: true }, options);
    await sunoOperator.timing({ audio_id: 'audio-1' }, options);

    expect(x402.quote).toHaveBeenCalledWith('/suno/audios', { prompt: 'song' }, expect.any(Object));
    expect(x402.post.mock.calls.map((call) => call[0])).toEqual([
      '/suno/audios',
      '/suno/lyrics',
      '/suno/style',
      '/suno/wav',
      '/suno/midi',
      '/suno/persona',
      '/suno/voices',
      '/suno/vox',
      '/suno/timing'
    ]);
  });

  it('keeps upload outside the x402 submit helper', () => {
    expect(sunoOperator.upload).toBeTypeOf('function');
  });
});
