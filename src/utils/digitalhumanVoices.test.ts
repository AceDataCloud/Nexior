import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DIGITALHUMAN_VOICES_STORAGE_KEY } from '@/constants';
import { addVoice, nextVoiceName, readVoices, removeVoice } from './digitalhumanVoices';

const store = new Map<string, string>();

vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k)
});

const voice = (id: string, name = id) => ({ voice_id: id, name, lang: 'zh', created_at: 1 });

describe('utils/digitalhumanVoices', () => {
  beforeEach(() => store.clear());

  it('returns an empty book when nothing is saved', () => {
    expect(readVoices()).toEqual([]);
  });

  // The book is the only record of a paid clone, so a bad payload must degrade
  // to "empty" rather than throw and take the config panel down with it.
  it.each(['not json at all', '{"not":"an array"}', '[1, null, {"name":"no id"}]'])(
    'survives the corrupt payload %j',
    (payload) => {
      store.set(DIGITALHUMAN_VOICES_STORAGE_KEY, payload);
      expect(readVoices()).toEqual([]);
    }
  );

  it('keeps newly added voices first', () => {
    addVoice(voice('a'));
    addVoice(voice('b'));
    expect(readVoices().map((v) => v.voice_id)).toEqual(['b', 'a']);
  });

  it('replaces rather than duplicates when the same voice is re-cloned', () => {
    addVoice(voice('a', 'old name'));
    addVoice(voice('a', 'new name'));
    expect(readVoices()).toHaveLength(1);
    expect(readVoices()[0].name).toBe('new name');
  });

  it('removes a voice and leaves the others alone', () => {
    addVoice(voice('a'));
    addVoice(voice('b'));
    expect(removeVoice('a').map((v) => v.voice_id)).toEqual(['b']);
    expect(removeVoice('missing').map((v) => v.voice_id)).toEqual(['b']);
  });

  it('caps the book so one browser cannot grow without bound', () => {
    for (let i = 0; i < 25; i++) addVoice(voice(`v${i}`));
    expect(readVoices()).toHaveLength(20);
    expect(readVoices()[0].voice_id).toBe('v24');
  });

  it('fills in a default lang and timestamp for a partial entry', () => {
    store.set(DIGITALHUMAN_VOICES_STORAGE_KEY, JSON.stringify([{ voice_id: 'a', name: 'A' }]));
    expect(readVoices()[0]).toMatchObject({ lang: 'zh', created_at: 0 });
  });

  it('numbers the default name by how many voices already exist', () => {
    expect(nextVoiceName('我的音色')).toBe('我的音色 1');
    addVoice(voice('a'));
    expect(nextVoiceName('我的音色')).toBe('我的音色 2');
  });

  it('does not throw when localStorage itself is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      }
    });
    expect(readVoices()).toEqual([]);
    expect(() => addVoice(voice('a'))).not.toThrow();
  });
});
