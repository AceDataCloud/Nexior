// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { buildFishTtsRequest } from './Tts.vue';

describe('fish/Tts request', () => {
  it('sends only one-shot references in instant mode', () => {
    const references = [{ audio: 'https://cdn.acedata.cloud/reference.mp3', text: 'Exact transcript' }];
    expect(
      buildFishTtsRequest(
        { voiceMode: 'instant', reference_id: 'saved-voice', references, format: 'mp3' },
        'New speech'
      )
    ).toEqual({ text: 'New speech', async: true, references, format: 'mp3' });
  });

  it('keeps a saved voice when instant mode is not selected', () => {
    expect(buildFishTtsRequest({ voiceMode: 'saved', reference_id: 'saved-voice' }, 'New speech')).toEqual({
      text: 'New speech',
      async: true,
      reference_id: 'saved-voice'
    });
  });
});
