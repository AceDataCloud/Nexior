// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { getPersistedMemoryEnabled } from './memoryPreference';

describe('getPersistedMemoryEnabled', () => {
  beforeEach(() => window.localStorage.clear());

  it('uses the latest persisted preference from another tab', () => {
    window.localStorage.setItem('vuex', JSON.stringify({ chat: { memoryEnabled: false } }));

    expect(getPersistedMemoryEnabled(true)).toBe(false);
  });

  it('falls back when persisted state is missing or invalid', () => {
    expect(getPersistedMemoryEnabled(false)).toBe(false);
    window.localStorage.setItem('vuex', '{');
    expect(getPersistedMemoryEnabled(true)).toBe(true);
  });
});
