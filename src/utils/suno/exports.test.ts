import { describe, expect, it } from 'vitest';
import { encodeSunoMidi } from './midi';
import { timingWords, timingSrt } from './timing';
import { isValidVocalRange } from './vocal';
import { clearSunoOperation } from './operation';

describe('Suno exports', () => {
  it('writes a MIDI file with correct tempo, tracks, note times and normalized velocity', () => {
    const bytes = encodeSunoMidi([
      { state: 'complete', instruments: [{ name: 'Piano', notes: [{ pitch: 60, start: 0.5, end: 1, velocity: 0.5 }] }] }
    ]);
    expect(new TextDecoder().decode(bytes.slice(0, 4))).toBe('MThd');
    const view = new DataView(bytes.buffer);
    expect(view.getUint32(4)).toBe(6);
    expect(view.getUint16(8)).toBe(1);
    expect(view.getUint16(10)).toBe(2);
    expect(view.getUint16(12)).toBe(480);
    // 500000 us per beat; 480 ticks (0.5 seconds) before note-on/off.
    expect(Array.from(bytes.slice(22, 29))).toEqual([0, 255, 81, 3, 7, 161, 32]);
    expect(Array.from(bytes.slice(-14))).toEqual([131, 96, 144, 60, 64, 131, 96, 128, 60, 0, 0, 255, 47, 0]);
  });
  it('rejects pending or invalid MIDI rather than exporting a broken file', () => {
    expect(() => encodeSunoMidi([{ state: 'pending', instruments: [] }])).toThrow();
    expect(() => encodeSunoMidi([])).toThrow();
    expect(() =>
      encodeSunoMidi([{ instruments: [{ notes: [{ pitch: 128, start: 0, end: 1, velocity: 1 }] }] }])
    ).toThrow();
  });
  it('normalizes both timing response shapes and exports valid SRT timestamps', () => {
    const data = {
      aligned_words: [
        { word: 'Hello', start_s: 2.63, end_s: 3.43 },
        { word: 'bad', start_s: -1, end_s: 2 },
        { word: 'unaligned', start_s: 4, end_s: 5, success: false }
      ]
    };
    expect(timingWords(data)).toEqual(timingWords([data]));
    expect(timingSrt(timingWords(data))).toBe('1\n00:00:02,630 --> 00:00:03,430\nHello\n');
  });
  it('enforces the vocal extraction contract including fractional seconds', () => {
    expect(isValidVocalRange(2.25, 22.5, 60)).toBe(true);
    for (const [start, end] of [
      [-1, 1],
      [0, 30],
      [3, 3],
      [4, 3],
      [0, NaN],
      [Infinity, 4]
    ])
      expect(isValidVocalRange(start, end)).toBe(false);
    expect(isValidVocalRange(0, 20, 10)).toBe(false);
  });
  it('retains creative inputs while removing every previous operation', () => {
    expect(
      clearSunoOperation({
        title: 'Draft',
        lyric: 'Words',
        continue_at: 0,
        action: 'inspo',
        audio_urls: ['https://example.com/a.mp3'],
        custom_model_id: 'old',
        persona_id: 'old',
        samples_start: 2
      })
    ).toMatchObject({
      title: 'Draft',
      lyric: 'Words',
      action: undefined,
      continue_at: undefined,
      audio_urls: undefined,
      custom_model_id: undefined,
      persona_id: undefined,
      samples_start: undefined
    });
  });
});
