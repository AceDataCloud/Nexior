import { describe, expect, it } from 'vitest';
import initialState from './state';
import { resetAll, setMemoryEnabled } from './mutations';

describe('chat mutations', () => {
  it('preserves the memory preference when resetting chat state', () => {
    const state = initialState();
    setMemoryEnabled(state, false);
    state.pendingDraft = 'discard me';

    resetAll(state);

    expect(state.memoryEnabled).toBe(false);
    expect(state.pendingDraft).toBe('');
  });
});
