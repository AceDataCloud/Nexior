export interface MidiInstrument {
  name?: string;
  notes: Array<{ pitch: number; start: number; end: number; velocity: number }>;
}

const variableLength = (value: number): number[] => {
  if (!Number.isSafeInteger(value) || value < 0 || value > 0x0fffffff) throw new Error('Invalid MIDI time');
  const bytes = [value & 0x7f];
  while ((value = Math.floor(value / 128))) bytes.unshift((value & 0x7f) | 0x80);
  return bytes;
};
const uint32 = (value: number) => [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
const chunk = (name: string, bytes: number[]) => [...new TextEncoder().encode(name), ...uint32(bytes.length), ...bytes];

/** Standard MIDI format 1: 480 PPQ at 120 BPM, so one second is 960 ticks. */
export function encodeSunoMidi(
  results: Array<{ state?: string; instruments: MidiInstrument[] }>
): Uint8Array<ArrayBuffer> {
  if (results.some((result) => result.state && result.state !== 'complete')) throw new Error('MIDI is not complete');
  const instruments = results
    .flatMap((result) => result.instruments || [])
    .filter((instrument) => instrument.notes?.length);
  if (!instruments.length) throw new Error('No MIDI notes');
  if (instruments.length >= 65535) throw new Error('Too many MIDI tracks');
  const tracks: number[][] = [chunk('MTrk', [0, 0xff, 0x51, 3, 7, 0xa1, 0x20, 0, 0xff, 0x2f, 0])];
  instruments.forEach((instrument, index) => {
    // Channel 10 is reserved for percussion. Keep the extracted instrument name
    // in track metadata; note extraction does not supply a General MIDI program.
    const channel = (index % 15) + (index % 15 >= 9 ? 1 : 0);
    const events: Array<{ tick: number; bytes: number[]; off: boolean }> = [];
    for (const note of instrument.notes) {
      if (
        !Number.isInteger(note.pitch) ||
        note.pitch < 0 ||
        note.pitch > 127 ||
        !Number.isFinite(note.start) ||
        !Number.isFinite(note.end) ||
        note.start < 0 ||
        note.end <= note.start ||
        !Number.isFinite(note.velocity) ||
        note.velocity < 0 ||
        note.velocity > 1
      )
        throw new Error('Invalid MIDI note');
      const start = Math.round(note.start * 960);
      const end = Math.max(start + 1, Math.round(note.end * 960));
      events.push({
        tick: start,
        bytes: [0x90 | channel, note.pitch, Math.max(1, Math.round(note.velocity * 127))],
        off: false
      });
      events.push({ tick: end, bytes: [0x80 | channel, note.pitch, 0], off: true });
    }
    events.sort((a, b) => a.tick - b.tick || Number(b.off) - Number(a.off));
    const name = Array.from(new TextEncoder().encode(instrument.name || `Track ${index + 1}`));
    const bytes = [0, 0xff, 3, ...variableLength(name.length), ...name];
    let previousTick = 0;
    for (const event of events) {
      bytes.push(...variableLength(event.tick - previousTick), ...event.bytes);
      previousTick = event.tick;
    }
    bytes.push(0, 0xff, 0x2f, 0);
    tracks.push(chunk('MTrk', bytes));
  });
  const count = tracks.length;
  const bytes = chunk('MThd', [0, 1, count >>> 8, count & 255, 1, 0xe0]);
  for (const track of tracks) for (const byte of track) bytes.push(byte);
  return new Uint8Array(bytes);
}
