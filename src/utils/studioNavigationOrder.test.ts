// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { dropStudioNavigation, loadStudioNavigationOrder, studioNavigationOrder } from './studioNavigationOrder';

afterEach(() => {
  localStorage.clear();
  studioNavigationOrder.value = [];
});

describe('Studio navigation order', () => {
  const keys = ['chatgpt', 'claude', 'flux'];
  const drag = (source: string) => ({ dataTransfer: { getData: () => source } });

  it('moves an entry into the target position and reloads the saved order', () => {
    dropStudioNavigation(drag('flux'), 'chatgpt', keys);
    expect(studioNavigationOrder.value).toEqual(['flux', 'chatgpt', 'claude']);

    studioNavigationOrder.value = [];
    loadStudioNavigationOrder();
    expect(studioNavigationOrder.value).toEqual(['flux', 'chatgpt', 'claude']);
  });

  it('rejects drops across settings groups', () => {
    dropStudioNavigation(drag('flux'), 'chatgpt', keys, ['chatgpt', 'claude']);
    expect(studioNavigationOrder.value).toEqual([]);
  });
});
