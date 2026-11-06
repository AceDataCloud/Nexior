// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import type { IOpenAIImageConfig } from '@/models';
import AdvancedOptions from './AdvancedOptions.vue';

function mountOptions() {
  const state = reactive({
    token: { access: 'fixture' },
    openaiimage: {
      config: {
        model: 'gpt-image-2.6-flare',
        image_urls: ['https://example.test/base.png'],
        output_format: 'png'
      } as IOpenAIImageConfig
    }
  });
  const commit = vi.fn((_name: string, value: IOpenAIImageConfig) => {
    state.openaiimage.config = value;
  });
  const wrapper = shallowMount(AdvancedOptions, {
    global: {
      mocks: { $t: (key: string) => key, $store: { state, commit } },
      stubs: { InfoIcon: true, ImagePreview: true }
    }
  });
  return { wrapper, state };
}

describe('OpenAI Image advanced options', () => {
  it('clears 2.6-only complexity and markup when changing models', async () => {
    const { wrapper, state } = mountOptions();
    (wrapper.vm as any).complexity = 'low';
    (wrapper.vm as any).onSuccess({ file_url: 'https://example.test/markup.png' });
    expect(state.openaiimage.config).toMatchObject({ complexity: 'low', markup: 'https://example.test/markup.png' });
    state.openaiimage.config.model = 'gpt-image-2';
    await wrapper.vm.$nextTick();
    expect(state.openaiimage.config.complexity).toBeUndefined();
    expect(state.openaiimage.config.markup).toBeUndefined();
  });

  it.each(['gif', 'no-reference'])('does not retain an annotation after %s or a late upload', async (change) => {
    const { wrapper, state } = mountOptions();
    (wrapper.vm as any).onSuccess({ file_url: 'https://example.test/markup.png' });
    if (change === 'gif') state.openaiimage.config.output_format = 'gif';
    else state.openaiimage.config.image_urls = [];
    await wrapper.vm.$nextTick();
    (wrapper.vm as any).onSuccess({ file_url: 'https://example.test/late.png' });
    expect(state.openaiimage.config.markup).toBeUndefined();
  });
});
