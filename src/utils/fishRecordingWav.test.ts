import { describe, expect, it } from 'vitest';
import { encodeMonoWav } from './fishRecordingWav';

describe('Fish recording WAV conversion', () => {
  it('writes a decodable mono PCM WAV header and downmixed samples', async () => {
    const left = new Float32Array([1, 0, -1]);
    const right = new Float32Array([1, 0.5, -1]);
    const audio = {
      length: 3,
      numberOfChannels: 2,
      sampleRate: 16000,
      getChannelData: (index: number) => (index === 0 ? left : right)
    } as AudioBuffer;

    const wav = encodeMonoWav(audio);
    const bytes = new DataView(await wav.arrayBuffer());
    const label = (offset: number, count: number) =>
      String.fromCharCode(...Array.from({ length: count }, (_, i) => bytes.getUint8(offset + i)));

    expect(wav.type).toBe('audio/wav');
    expect(wav.size).toBe(50);
    expect(label(0, 4)).toBe('RIFF');
    expect(label(8, 4)).toBe('WAVE');
    expect(label(12, 4)).toBe('fmt ');
    expect(bytes.getUint16(20, true)).toBe(1);
    expect(bytes.getUint16(22, true)).toBe(1);
    expect(bytes.getUint32(24, true)).toBe(16000);
    expect(bytes.getUint16(34, true)).toBe(16);
    expect(label(36, 4)).toBe('data');
    expect(bytes.getUint32(40, true)).toBe(6);
    expect(bytes.getInt16(44, true)).toBe(32767);
    expect(bytes.getInt16(46, true)).toBe(8191);
    expect(bytes.getInt16(48, true)).toBe(-32768);
  });
});
