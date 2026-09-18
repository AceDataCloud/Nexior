// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ cookie: undefined as string | undefined }));
vi.mock('typescript-cookie', () => ({
  getCookie: () => state.cookie,
  setCookie: vi.fn(),
  removeCookie: vi.fn()
}));
vi.mock('@/store', () => ({ default: { getters: { config: { features: {} } } } }));

import { getStickyFeatureOverrides } from './featureFlag';

describe('getStickyFeatureOverrides', () => {
  beforeEach(() => {
    state.cookie = undefined;
  });

  it.each([
    [undefined, ''],
    [JSON.stringify(['airwallex']), 'airwallex'],
    [JSON.stringify(['__all__']), 'all'],
    [JSON.stringify(['!airwallex']), '-airwallex'],
    [JSON.stringify(['__all__', '!airwallex']), 'all,-airwallex']
  ])('serializes %s as %s', (cookie, expected) => {
    state.cookie = cookie;
    expect(getStickyFeatureOverrides()).toBe(expected);
  });
});
