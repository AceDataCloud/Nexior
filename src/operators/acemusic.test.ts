import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { acemusicOperator, buildAcemusicAudioRequest, isAcemusicRequestValid } from './acemusic';
vi.mock('axios', () => ({ default: { post: vi.fn().mockResolvedValue({ data: {} }) } }));
describe('ACE Music API contract', () => {
  beforeEach(() => vi.clearAllMocks());
  it('submits only fields belonging to the selected generation mode', () => {
    const config = {
      model: 'acemusic-v1.1' as const,
      custom: false,
      prompt: ' A song ',
      lyric: ' old lyrics ',
      style: ' old style ',
      title: ' old title ',
      instrumental: true
    };
    expect(buildAcemusicAudioRequest(config)).toEqual({
      action: 'generate',
      model: 'acemusic-v1.1',
      custom: false,
      prompt: 'A song',
      async: true
    });
    expect(buildAcemusicAudioRequest({ ...config, custom: true })).toEqual({
      action: 'generate',
      model: 'acemusic-v1.1',
      custom: true,
      lyric: 'old lyrics',
      style: 'old style',
      title: 'old title',
      async: true
    });
  });
  it('lists authenticated audio history with bounded pagination and no client owner identity', async () => {
    await acemusicOperator.tasks({ limit: 10, offset: 20, createdAtMax: 123 }, { token: 'test-key' });
    expect(axios.post).toHaveBeenCalledWith(
      '/acemusic/tasks',
      { action: 'list', type: 'audios', limit: 10, offset: 20, created_at_max: 123 },
      expect.objectContaining({ headers: { authorization: 'Bearer test-key', 'content-type': 'application/json' } })
    );
  });
  it('polls the original task IDs without a generation or billing bypass request', async () => {
    await acemusicOperator.tasks({ ids: ['task-1'] }, { token: 'test-key' });
    expect(axios.post).toHaveBeenCalledWith(
      '/acemusic/tasks',
      { action: 'retrieve_batch', ids: ['task-1'] },
      expect.anything()
    );
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
  it('keeps lyrics synchronous and refuses unsupported wallet submission', async () => {
    await acemusicOperator.lyrics({ prompt: 'home', style: 'folk' }, { token: 'test-key' });
    expect(axios.post).toHaveBeenCalledWith('/acemusic/lyrics', { prompt: 'home', style: 'folk' }, expect.anything());
    expect(() => acemusicOperator.audio(buildAcemusicAudioRequest(), { mode: 'x402' })).toThrow();
  });
  it('forwards a durable idempotency key for generation recovery', async () => {
    await acemusicOperator.audio(buildAcemusicAudioRequest(), { token: 'test-key', idempotencyKey: 'original-key' });
    expect(axios.post).toHaveBeenCalledWith(
      '/acemusic/audios',
      expect.anything(),
      expect.objectContaining({ headers: expect.objectContaining({ 'Idempotency-Key': 'original-key' }) })
    );
  });
  it('keeps imports separate from paid generation and omits stale generation fields', () => {
    const request = buildAcemusicAudioRequest({
      model: 'acemusic-v1',
      custom: true,
      action: 'upload',
      audio_url: ' https://example.com/owned.mp3 ',
      name: ' Own audio ',
      audio_id: 'source',
      lyric: 'old',
      style: 'old'
    });
    expect(request).toEqual({
      action: 'upload',
      audio_url: 'https://example.com/owned.mp3',
      name: 'Own audio',
      audio_id: 'source',
      async: true
    });
    expect(isAcemusicRequestValid(request)).toBe(true);
    expect(isAcemusicRequestValid({ ...request, audio_url: 'http://example.com/a.mp3' })).toBe(false);
  });
  it('requires explicit public references and preserves the action when preparing covers and mashups', () => {
    const config = {
      model: 'acemusic-v1' as const,
      custom: false,
      prompt: 'old',
      action: 'cover' as const,
      lyric: 'words',
      style: 'folk',
      audio_id: 'public-source'
    };
    const cover = buildAcemusicAudioRequest(config);
    expect(cover).toEqual({
      action: 'cover',
      model: 'acemusic-v1.1',
      lyric: 'words',
      style: 'folk',
      audio_id: 'public-source',
      audio_influence: 60,
      async: true
    });
    expect(isAcemusicRequestValid(cover)).toBe(true);
    const mashup = buildAcemusicAudioRequest({
      ...config,
      action: 'mashup',
      mashup_audio_ids: ['one', 'two'],
      audio_influence: 72
    });
    expect(mashup).not.toHaveProperty('audio_id');
    expect(mashup.audio_influence).toBe(72);
    expect(isAcemusicRequestValid(mashup)).toBe(true);
    expect(isAcemusicRequestValid({ ...mashup, mashup_audio_ids: ['one', 'one'] })).toBe(false);
    expect(isAcemusicRequestValid({ ...mashup, mashup_audio_ids: ['one'] })).toBe(false);
  });
  it('keeps reference IDs on idea generation and asset reads on their own path', async () => {
    const draft = {
      model: 'acemusic-v1.1' as const,
      custom: false,
      prompt: 'A song',
      asset_id: 'a',
      asset_type: 'midi' as const
    };
    const request = buildAcemusicAudioRequest(draft);
    expect(isAcemusicRequestValid(request)).toBe(true);
    expect(isAcemusicRequestValid({ ...request, asset_id: undefined })).toBe(false);
    expect(isAcemusicRequestValid({ ...request, model: 'acemusic-v1' })).toBe(false);
    expect(buildAcemusicAudioRequest({ ...draft, custom: true })).not.toHaveProperty('asset_type');
    const opts = { token: 'test-key' };
    await acemusicOperator.uploadAsset(
      { action: 'upload', type: 'midi', url: 'https://example.com/song.mid', async: true },
      opts
    );
    await acemusicOperator.asset('a', opts);
    await acemusicOperator.assets(2, opts, 'image');
    expect(vi.mocked(axios.post).mock.calls.map(([url, body]) => [url, body])).toEqual([
      ['/acemusic/assets', { action: 'upload', type: 'midi', url: 'https://example.com/song.mid', async: true }],
      ['/acemusic/assets', { action: 'retrieve', id: 'a' }],
      ['/acemusic/assets', { action: 'retrieve', page: 2, page_size: 20, type: 'image' }]
    ]);
  });
});
