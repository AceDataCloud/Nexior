import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { acemusicOperator, buildAcemusicAudioRequest } from './acemusic';
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
});
