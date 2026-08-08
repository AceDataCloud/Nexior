import { describe, expect, it, vi } from 'vitest';
import { buildKlingTalkingPhotoRequest, buildKlingVideoRequest, klingOperator } from './kling';
import { buildDigitalHumanVideoRequest, buildDigitalHumanVoiceRequest, digitalHumanOperator } from './digitalhuman';

const x402 = vi.hoisted(() => ({ quote: vi.fn(), post: vi.fn() }));
const axios = vi.hoisted(() => ({ post: vi.fn() }));

vi.mock('./x402', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./x402')>()),
  quoteX402: x402.quote,
  postWithX402: x402.post
}));
vi.mock('axios', () => ({ default: { post: axios.post } }));

describe('special video x402 requests', () => {
  it('normalizes Kling video and talking-photo requests independently', () => {
    expect(
      buildKlingVideoRequest({
        model: 'kling-v3',
        mode: 'std',
        duration: 10,
        start_image_url: 'start.png',
        camera_control: { type: 'simple', config: { horizontal: 1, pan: undefined } }
      })
    ).toEqual({
      model: 'kling-v3',
      mode: 'std',
      duration: 10,
      start_image_url: 'start.png',
      action: 'image2video',
      camera_control: { type: 'simple', config: { horizontal: 1 } },
      async: true
    });
    expect(
      buildKlingTalkingPhotoRequest({ image_url: 'face.png', audio_url: 'voice.mp3', duration: 10 })
    ).toMatchObject({
      image_url: 'face.png',
      audio_url: 'voice.mp3',
      duration: 10,
      async: true
    });
  });

  it('routes Kling talking-photo quote and payment to its own endpoint', async () => {
    x402.quote.mockResolvedValueOnce({ amountUsdc: '1' });
    x402.post.mockResolvedValueOnce({ data: { task_id: 'talk-1' } });
    const request = buildKlingTalkingPhotoRequest({ image_url: 'face.png', audio_url: 'voice.mp3' });

    await klingOperator.quoteTalkingPhoto(request);
    await klingOperator.talkingPhoto(request, {
      mode: 'x402',
      x402: { wallet: {} as never, confirm: async () => true }
    });

    expect(x402.quote).toHaveBeenCalledWith('/kling/talking-photo', request, expect.any(Object));
    expect(x402.post).toHaveBeenCalledWith('/kling/talking-photo', request, expect.any(Object), expect.any(Object));
  });

  it('normalizes Digital Human video and voice payloads independently', () => {
    expect(
      buildDigitalHumanVideoRequest(
        { image_url: 'face.png', text: 'hello', voice_id: 'voice-1', speed: 1.2 },
        'photo',
        'text'
      )
    ).toEqual({ video_url: 'face.png', text: 'hello', voice_id: 'voice-1', speed: 1.2, async: true });
    expect(buildDigitalHumanVoiceRequest({ audio_url: 'voice.mp3', lang: 'en', name: 'Voice' })).toEqual({
      audio_url: 'voice.mp3',
      lang: 'en',
      name: 'Voice',
      async: true
    });
  });

  it('routes voice quote/payment separately and keeps x402 polling free', async () => {
    x402.quote.mockResolvedValueOnce({ amountUsdc: '1' });
    x402.post.mockResolvedValueOnce({ data: { task_id: 'voice-1' } });
    axios.post.mockResolvedValueOnce({ data: { voice_id: 'ready' } });
    const request = buildDigitalHumanVoiceRequest({ audio_url: 'voice.mp3' });

    await digitalHumanOperator.quoteVoice(request);
    await digitalHumanOperator.cloneVoice(request, {
      mode: 'x402',
      x402: { wallet: {} as never, confirm: async () => true }
    });
    await digitalHumanOperator.pollTask('voice-1', { mode: 'x402' });

    expect(x402.quote).toHaveBeenCalledWith('/digital-human/voices', request, expect.any(Object));
    expect(x402.post).toHaveBeenCalledWith('/digital-human/voices', request, expect.any(Object), expect.any(Object));
    expect(axios.post).toHaveBeenCalledWith(
      '/digital-human/tasks',
      { task_id: 'voice-1' },
      expect.objectContaining({
        baseURL: 'https://x402.acedata.cloud',
        headers: expect.not.objectContaining({ authorization: expect.anything() })
      })
    );
  });
});
