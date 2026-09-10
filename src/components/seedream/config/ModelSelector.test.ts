// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import ModelSelector from './ModelSelector.vue';

const mountSelector = (config: Record<string, unknown>) => {
  const commit = vi.fn();
  const wrapper = shallowMount(ModelSelector, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: { seedream: { config } },
          commit
        }
      }
    }
  });
  return { commit, wrapper };
};

describe('seedream/ModelSelector', () => {
  it('does not offer unavailable 3.0 models', () => {
    const { wrapper } = mountSelector({ model: 'doubao-seedream-5-0-lite-260128', size: '2K' });
    const options = (wrapper.vm as unknown as { options: Array<{ value: string }> }).options;

    expect(options.map((option) => option.value)).not.toContain('doubao-seedream-3-0-t2i-250415');
    expect(options.map((option) => option.value)).not.toContain('doubao-seededit-3-0-i2i-250628');
  });

  it('does not expose the legacy 5.0 model id', () => {
    const { wrapper } = mountSelector({ model: 'doubao-seedream-5-0-lite-260128', size: '2K' });
    const options = (wrapper.vm as unknown as { options: Array<{ value: string }> }).options;

    expect(options.map((option) => option.value)).not.toContain('doubao-seedream-5-0-260128');
    expect(options.map((option) => option.value)).toContain('doubao-seedream-5-0-lite-260128');
  });

  it('migrates a persisted legacy 5.0 model without clearing compatible settings', () => {
    const { commit } = mountSelector({ model: 'doubao-seedream-5-0-260128', size: '2K', stream: true });

    expect(commit).toHaveBeenCalledWith('seedream/setConfig', {
      model: 'doubao-seedream-5-0-lite-260128',
      size: '2K',
      stream: true
    });
  });

  it('migrates a persisted unavailable model to the supported default', () => {
    const { commit } = mountSelector({
      model: 'doubao-seedream-3-0-t2i-250415',
      size: '1K',
      seed: 42,
      guidance_scale: 2.5
    });

    expect(commit).toHaveBeenCalledWith(
      'seedream/setConfig',
      expect.objectContaining({ model: 'doubao-seedream-5-0-lite-260128' })
    );
    const migrated = commit.mock.calls[0][1];
    expect(migrated).not.toHaveProperty('size');
    expect(migrated).not.toHaveProperty('seed');
    expect(migrated).not.toHaveProperty('guidance_scale');
  });
});
