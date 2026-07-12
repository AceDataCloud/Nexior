import { describe, expect, it } from 'vitest';

import { setConfig } from './mutations';
import initialState from './state';

describe('Maestro config mutations', () => {
  it('normalizes legacy languages written by remix', () => {
    const state = initialState();

    setConfig(state, {
      action: 'remix',
      ref_task_id: 'legacy-task',
      langs: ['it', 'en', 'en']
    });

    expect(state.config).toMatchObject({
      action: 'remix',
      ref_task_id: 'legacy-task',
      langs: ['en']
    });
  });

  it('normalizes customization config at the Vuex boundary', () => {
    const state = initialState();

    setConfig(state, {
      scenario_customization_enabled: false,
      style_customization_enabled: true,
      voice_customization_enabled: true,
      scenario: 'avatar',
      style: ' AUTO ',
      voice: 'unknown-voice'
    });

    expect(state.config).toEqual({
      scenario_customization_enabled: false,
      style_customization_enabled: true,
      voice_customization_enabled: true,
      style: 'cinematic',
      voice: 'warm-female',
      langs: ['zh-cn']
    });
  });
});
