// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import QualitySelector from './QualitySelector.vue';
import {
  OPENAIIMAGE_DEFAULT_QUALITY,
  OPENAIIMAGE_MODELS,
  OPENAIIMAGE_MODEL_GPT_IMAGE_2,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE_OFFICIAL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST_OFFICIAL
} from '@/constants';

function mountSelector(config: Record<string, unknown>) {
  const commit = vi.fn();
  const wrapper = shallowMount(QualitySelector, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state: { openaiimage: { config } }, commit }
      },
      stubs: { InfoIcon: true }
    }
  });
  return { wrapper, commit };
}

const GPT_IMAGE_25_MODELS = [
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE_OFFICIAL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST_OFFICIAL
];

const committedConfig = (commit: ReturnType<typeof vi.fn>) => commit.mock.calls.at(-1)?.[1];

describe('OpenAIImageQualitySelector', () => {
  it('uses auto when quality is missing', () => {
    const { wrapper } = mountSelector({ model: OPENAIIMAGE_MODEL_GPT_IMAGE_2 });
    expect((wrapper.vm as any).quality).toBe(OPENAIIMAGE_DEFAULT_QUALITY);
  });

  it('commits the selected quality without dropping other config', () => {
    const { wrapper, commit } = mountSelector({
      model: OPENAIIMAGE_MODEL_GPT_IMAGE_2,
      size: '2048x2048',
      prompt: 'draw a cat'
    });

    (wrapper.vm as any).quality = 'high';

    expect(committedConfig(commit)).toEqual({
      model: OPENAIIMAGE_MODEL_GPT_IMAGE_2,
      size: '2048x2048',
      prompt: 'draw a cat',
      quality: 'high'
    });
  });

  it.each(OPENAIIMAGE_MODELS)('offers the GPT Image quality options for %s', (model) => {
    const { wrapper } = mountSelector({ model, quality: 'medium' });
    expect((wrapper.vm as any).qualities).toEqual(['auto', 'low', 'medium', 'high']);
    expect((wrapper.vm as any).qualities).not.toContain('standard');
    expect((wrapper.vm as any).qualities).not.toContain('hd');
  });

  it.each(GPT_IMAGE_25_MODELS)('preserves a valid quality for GPT Image 2.5 model %s', (model) => {
    const { wrapper, commit } = mountSelector({ model, quality: 'high' });
    expect((wrapper.vm as any).quality).toBe('high');
    expect(commit).not.toHaveBeenCalled();
  });

  it('normalizes a historical invalid quality when the model changes', async () => {
    const config = reactive<Record<string, unknown>>({
      model: OPENAIIMAGE_MODEL_GPT_IMAGE_2,
      quality: 'standard'
    });
    const { wrapper, commit } = mountSelector(config);

    config.model = OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST;
    await wrapper.vm.$nextTick();

    expect(committedConfig(commit)).toEqual({
      model: OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST,
      quality: 'auto'
    });
  });
});
