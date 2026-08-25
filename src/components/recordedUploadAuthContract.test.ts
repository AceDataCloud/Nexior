import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('recorded audio upload auth', () => {
  it.each(['./fish/model/Recorder.vue', './suno/config/UploadAudio.vue'])(
    'checks deferred auth before sending %s',
    (path) => {
      const component = source(path);
      const guard = component.indexOf('if (!ensureUploadAuthenticated()) return;');
      const network = Math.min(
        ...['axios.post(', 'fetch(this.uploadUrl'].map((needle) => {
          const index = component.indexOf(needle);
          return index < 0 ? Number.POSITIVE_INFINITY : index;
        })
      );
      expect(guard).toBeGreaterThan(-1);
      expect(network).toBeGreaterThan(guard);
    }
  );
});
