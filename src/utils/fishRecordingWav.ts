/** Convert a browser MediaRecorder clip into the PCM WAV accepted by Fish model creation. */
export function encodeMonoWav(audio: AudioBuffer): Blob {
  if (!audio.length || !audio.numberOfChannels) throw new Error('Recording contains no audio');

  const channels = Array.from({ length: audio.numberOfChannels }, (_, index) => audio.getChannelData(index));
  const dataSize = audio.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const ascii = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) view.setUint8(offset + i, value.charCodeAt(i));
  };

  ascii(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  ascii(8, 'WAVE');
  ascii(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, audio.sampleRate, true);
  view.setUint32(28, audio.sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < audio.length; i++) {
    let sample = 0;
    for (const channel of channels) sample += channel[i];
    sample = Math.max(-1, Math.min(1, sample / channels.length));
    view.setInt16(44 + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export async function recordingToWav(recording: Blob): Promise<Blob> {
  const context = new AudioContext();
  try {
    return encodeMonoWav(await context.decodeAudioData(await recording.arrayBuffer()));
  } finally {
    await context.close();
  }
}
