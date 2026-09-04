// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import AdvancedOptions from './AdvancedOptions.vue';

const mountOptions = (config: Record<string, any>) => {
  const commit = vi.fn();
  const wrapper = shallowMount(AdvancedOptions, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state: { seedream: { config } }, commit }
      }
    }
  });
  return { commit, wrapper };
};

describe('Seedream advanced options', () => {
  it('switches Pro to decomposition and clears incompatible settings', () => {
    const { commit, wrapper } = mountOptions({
      model: 'doubao-seedream-5-0-pro-260628',
      image: ['one.png', 'two.png'],
      size: '2K',
      background: 'transparent',
      sequential_image_generation: 'auto',
      tools: [{ type: 'web_search' }]
    });

    (wrapper.vm as any).mode = 'layers';

    expect(commit).toHaveBeenCalledWith(
      'seedream/setConfig',
      expect.objectContaining({ layer_decomposition: true, image: ['one.png'], size: 'auto' })
    );
    const next = commit.mock.calls[0][1];
    expect(next).not.toHaveProperty('background');
    expect(next).not.toHaveProperty('sequential_image_generation');
    expect(next).not.toHaveProperty('tools');
  });

  it('forces PNG when transparent background is selected', () => {
    const { commit, wrapper } = mountOptions({ model: 'doubao-seedream-5-0-pro-260628', image: ['one.png'] });
    (wrapper.vm as any).background = 'transparent';
    expect(commit).toHaveBeenCalledWith(
      'seedream/setConfig',
      expect.objectContaining({ background: 'transparent', output_format: 'png' })
    );
  });
});
