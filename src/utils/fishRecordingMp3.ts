import { Mp3Encoder } from '@breezystack/lamejs';

const MP3_SAMPLE_RATE = 44100;
const MP3_BITRATE_KBPS = 192;
const MP3_FRAME_SAMPLES = 1152;

/** Convert decoded browser audio into a mono MP3 reference for Fish model creation. */
export function encodeMonoMp3(audio: AudioBuffer): Blob {
  if (!audio.length || !audio.numberOfChannels) throw new Error('Recording contains no audio');

  const channels = Array.from({ length: audio.numberOfChannels }, (_, index) => audio.getChannelData(index));
  const encoder = new Mp3Encoder(1, audio.sampleRate, MP3_BITRATE_KBPS);
  const chunks: Uint8Array[] = [];

  for (let offset = 0; offset < audio.length; offset += MP3_FRAME_SAMPLES) {
    const count = Math.min(MP3_FRAME_SAMPLES, audio.length - offset);
    const pcm = new Int16Array(count);
    for (let i = 0; i < count; i++) {
      let sample = 0;
      for (const channel of channels) sample += channel[offset + i];
      sample = Math.max(-1, Math.min(1, sample / channels.length));
      pcm[i] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
    }
    const encoded = encoder.encodeBuffer(pcm);
    if (encoded.length) chunks.push(new Uint8Array(encoded));
  }
  const finalChunk = encoder.flush();
  if (finalChunk.length) chunks.push(new Uint8Array(finalChunk));

  return new Blob(chunks, { type: 'audio/mpeg' });
}

export async function recordingToMp3(recording: Blob): Promise<Blob> {
  // decodeAudioData resamples to the context rate, which MP3 encoders support.
  const context = new AudioContext({ sampleRate: MP3_SAMPLE_RATE });
  try {
    return encodeMonoMp3(await context.decodeAudioData(await recording.arrayBuffer()));
  } finally {
    await context.close();
  }
}
