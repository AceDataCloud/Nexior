import { describe, expect, it } from 'vitest';
import { isAcemusicAudioPlayable, isAcemusicTaskPending, mergeAcemusicTasks } from './acemusic';
describe('ACE Music completion', () => {
  it('continues polling accepted and uncertain tasks even when the response envelope succeeds', () => {
    for (const state of ['created', 'submitting', 'processing', 'storing', 'submission_unknown']) {
      expect(isAcemusicTaskPending({ id: 'task', state, response: { success: true } })).toBe(true);
    }
  });
  it('stops polling explicit final outcomes including partial failure', () => {
    for (const state of ['succeeded', 'partial_failed', 'failed'])
      expect(isAcemusicTaskPending({ id: 'task', state })).toBe(false);
  });
  it('preserves completed audio in a partially failed group without offering failed audio', () => {
    expect(isAcemusicAudioPlayable({ id: 'one', state: 'succeeded', audio_url: 'https://example.com/song.mp3' })).toBe(
      true
    );
    expect(isAcemusicAudioPlayable({ id: 'two', state: 'failed', audio_url: 'https://example.com/stale.mp3' })).toBe(
      false
    );
    expect(isAcemusicAudioPlayable({ id: 'three', state: 'processing' })).toBe(false);
  });
});

it('does not regress a final result when an older poll returns later', () => {
  const complete = { id: 'one', state: 'succeeded', created_at: 1, response: { success: true } };
  expect(mergeAcemusicTasks([complete], [{ id: 'one', state: 'processing', created_at: 1 }])).toEqual([complete]);
});
