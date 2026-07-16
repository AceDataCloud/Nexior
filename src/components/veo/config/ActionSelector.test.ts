// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ActionSelector from './ActionSelector.vue';

describe('veo/config/ActionSelector', () => {
  it('uses explicit video-generation names for every action', () => {
    const wrapper = shallowMount(ActionSelector, {
      global: {
        mocks: {
          $t: (key: string) => key,
          $store: {
            state: { veo: { config: { action: 'text2video' } } },
            commit: vi.fn()
          }
        }
      }
    });

    expect((wrapper.vm as unknown as { options: { label: string }[] }).options.map(({ label }) => label)).toEqual([
      'veo.button.action1',
      'veo.button.action2',
      'veo.button.actionIngredients'
    ]);
  });

  it('accepts long unbroken translated labels', () => {
    const wrapper = shallowMount(ActionSelector, {
      global: {
        mocks: {
          $t: () => 'Monikuvayhdistelmävideot',
          $store: {
            state: { veo: { config: { action: 'ingredients2video' } } },
            commit: vi.fn()
          }
        }
      }
    });

    expect(
      (wrapper.vm as unknown as { options: { label: string }[] }).options.every(
        ({ label }) => label === 'Monikuvayhdistelmävideot'
      )
    ).toBe(true);
  });
});
