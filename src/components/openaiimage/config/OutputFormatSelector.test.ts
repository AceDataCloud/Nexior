// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import type { IOpenAIImageConfig } from '@/models';
import OutputFormatSelector from './OutputFormatSelector.vue';

function mountSelector(config: IOpenAIImageConfig) {
  const state = reactive({ openaiimage: { config } });
  const commit = vi.fn((_name: string, value: IOpenAIImageConfig) => {
    state.openaiimage.config = value;
  });
  const wrapper = shallowMount(OutputFormatSelector, {
    global: {
      mocks: { $t: (key: string) => key, $store: { state, commit } },
      stubs: { InfoIcon: true }
    }
  });
  return { wrapper, state, commit };
}

describe('OpenAI Image output formats', () => {
  it.each([
    'gpt-image-2.6-flare',
    'gpt-image-2.6-flare:reverse',
    'gpt-image-2.6-flare:official',
    'gpt-image-2.6-sunburst:official'
  ])('exposes native GIF for %s', (model) => {
    const { wrapper } = mountSelector({ model });
    expect((wrapper.vm as any).formats).toContain('gif');
    expect((wrapper.vm as any).visible).toBe(true);
  });

  it('uses the verified GIF preset and restores the previous static 4K size', async () => {
    const { wrapper, state } = mountSelector({ model: 'gpt-image-2.6-flare', size: '3840x2160' });
    (wrapper.vm as any).format = 'gif';
    await wrapper.vm.$nextTick();
    expect(state.openaiimage.config).toMatchObject({
      output_format: 'gif',
      size: '512x512',
      frame_count: 9,
      frame_duration_ms: 200
    });
    (wrapper.vm as any).frameCount = 4;
    (wrapper.vm as any).frameDuration = 100;
    expect(state.openaiimage.config).toMatchObject({ frame_count: 4, frame_duration_ms: 100 });
    (wrapper.vm as any).format = 'png';
    await wrapper.vm.$nextTick();
    expect(state.openaiimage.config).toMatchObject({ output_format: 'png', size: '3840x2160' });
    expect(state.openaiimage.config.frame_count).toBeUndefined();
    expect(state.openaiimage.config.frame_duration_ms).toBeUndefined();
  });

  it.each(['gpt-image-2.6-sunburst', 'gpt-image-2.6-sunburst:reverse', 'gpt-image-2.5-flare'])(
    'clears incompatible GIF settings when selecting %s',
    async (model) => {
      const { wrapper, state } = mountSelector({
        model: 'gpt-image-2.6-flare',
        output_format: 'gif',
        size: '512x512',
        frame_count: 9,
        frame_duration_ms: 200
      });
      state.openaiimage.config.model = model;
      await wrapper.vm.$nextTick();
      expect((wrapper.vm as any).formats).not.toContain('gif');
      expect(state.openaiimage.config.output_format).not.toBe('gif');
      expect(state.openaiimage.config.size).toBe('auto');
      expect(state.openaiimage.config.frame_count).toBeUndefined();
      expect(state.openaiimage.config.frame_duration_ms).toBeUndefined();
    }
  );
});
