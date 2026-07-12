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
});
