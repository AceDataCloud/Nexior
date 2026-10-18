import { describe, expect, it } from 'vitest';
import { encodeMonoMp3 } from './fishRecordingMp3';

describe('Fish recording MP3 conversion', () => {
  it('encodes browser audio into MP3 frames for upload', async () => {
    const sampleRate = 44100;
    const length = sampleRate / 4;
    const left = Float32Array.from({ length }, (_, index) => Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 0.6);
    const right = Float32Array.from({ length }, (_, index) => Math.sin((2 * Math.PI * 440 * index) / sampleRate) * 0.4);
    const audio = {
      length,
      numberOfChannels: 2,
      sampleRate,
      getChannelData: (index: number) => (index === 0 ? left : right)
    } as AudioBuffer;

    const mp3 = encodeMonoMp3(audio);
    const bytes = new Uint8Array(await mp3.arrayBuffer());
    const hasFrame = bytes.some((value, index) => value === 0xff && (bytes[index + 1] & 0xe0) === 0xe0);

    expect(mp3.type).toBe('audio/mpeg');
    expect(mp3.size).toBeGreaterThan(1000);
    expect(hasFrame).toBe(true);
  });
});
