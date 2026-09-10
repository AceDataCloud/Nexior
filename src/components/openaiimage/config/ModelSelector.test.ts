// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import ModelSelector from './ModelSelector.vue';
import {
  OPENAIIMAGE_DEFAULT_MODEL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE_OFFICIAL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST_OFFICIAL,
  OPENAIIMAGE_MODELS
} from '@/constants';

function mountSelector(model?: string) {
  const commit = vi.fn();
  const wrapper = shallowMount(ModelSelector, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state: { openaiimage: { config: { model } } }, commit }
      },
      stubs: { InfoIcon: true }
    }
  });
  return { wrapper, commit };
}

describe('OpenAIImageModelSelector', () => {
  it('exposes both exact GPT Image 2.5 models without invented aliases', () => {
    const { wrapper } = mountSelector(OPENAIIMAGE_DEFAULT_MODEL);
    const values = (wrapper.vm as any).options.map((option: { value: string }) => option.value);

    expect(values).toContain(OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE);
    expect(values).toContain(OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE_OFFICIAL);
    expect(values).toContain(OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST);
    expect(values).toContain(OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST_OFFICIAL);
    expect(values).toEqual(OPENAIIMAGE_MODELS);
    expect(values).not.toContain('gpt-image-2.5');
    expect(values).not.toContain('gpt-image-2.5:official');
    expect(values).not.toContain('gpt-image-2.5:reverse');
  });

  it('exposes the exact selected model as the truncated label title', () => {
    const { wrapper } = mountSelector(OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST);

    expect(wrapper.findComponent({ name: 'ElSelect' }).attributes('title')).toBe(
      OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST
    );
  });

  it('preserves gpt-image-2 as the default', () => {
    const { commit } = mountSelector();

    expect(commit).toHaveBeenCalledWith(
      'openaiimage/setConfig',
      expect.objectContaining({ model: OPENAIIMAGE_DEFAULT_MODEL })
    );
    expect(OPENAIIMAGE_DEFAULT_MODEL).toBe('gpt-image-2');
  });
});
