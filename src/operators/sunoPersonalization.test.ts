import { expect, it } from 'vitest';
import { buildSunoAudioRequest } from './suno';

it('preserves explicit false and omits absent personalization for new generation', () => {
  expect(buildSunoAudioRequest({ action: 'generate', personalization: false }).personalization).toBe(false);
  expect(buildSunoAudioRequest({ personalization: true }).personalization).toBe(true);
  expect(buildSunoAudioRequest({ action: 'generate' })).not.toHaveProperty('personalization');
});
it('drops a persisted generation-only setting on non-generation actions', () => {
  expect(buildSunoAudioRequest({ action: 'extend', personalization: true })).not.toHaveProperty('personalization');
});
