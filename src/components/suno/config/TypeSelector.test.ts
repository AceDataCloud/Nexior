// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import TypeSelector from './TypeSelector.vue';

const mountSelector = (model = '') => {
  const commit = vi.fn();
  const wrapper = mount(TypeSelector, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: { suno: { config: { model } } },
          commit
        }
      },
      stubs: {
        ElSelect: true,
        ElOption: true,
        ElSwitch: true
      }
    }
  });
  return { wrapper, commit };
};

describe('suno/config/TypeSelector', () => {
  it('offers the three v6 models first', () => {
    const { wrapper } = mountSelector('chirp-v6');
    const options = (wrapper.vm as unknown as { options: Array<{ value: string }> }).options;

    expect(options.slice(0, 3).map((option) => option.value)).toEqual(['chirp-v6', 'chirp-v6-wild', 'chirp-v6-mini']);
  });

  it('preserves the existing default when no model is configured', () => {
    const { commit } = mountSelector();

    expect(commit).toHaveBeenCalledWith('suno/setConfig', expect.objectContaining({ model: 'chirp-v5-5' }));
  });
});
