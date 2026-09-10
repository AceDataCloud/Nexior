// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import ResolutionSelector from './ResolutionSelector.vue';
import {
  OPENAIIMAGE_MODEL_GPT_IMAGE_1,
  OPENAIIMAGE_MODEL_GPT_IMAGE_2,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE_OFFICIAL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST_OFFICIAL,
  OPENAIIMAGE_SIZE_AUTO
} from '@/constants';

function mountSelector(config: Record<string, unknown>) {
  const commit = vi.fn();
  const wrapper = shallowMount(ResolutionSelector, {
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

const committedSize = (commit: ReturnType<typeof vi.fn>) => commit.mock.calls.at(-1)?.[1]?.size;

const GPT_IMAGE_25_MODELS = [
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE_OFFICIAL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST_OFFICIAL
];

describe('OpenAIImageSizeSelector auto handling', () => {
  it('shows auto as the selected preset when the store holds auto', () => {
    const { wrapper } = mountSelector({
      model: OPENAIIMAGE_MODEL_GPT_IMAGE_2,
      size: OPENAIIMAGE_SIZE_AUTO
    });
    expect((wrapper.vm as any).presetValue).toBe(OPENAIIMAGE_SIZE_AUTO);
  });

  it('sends auto to the store instead of dropping the field', () => {
    const { wrapper, commit } = mountSelector({ model: OPENAIIMAGE_MODEL_GPT_IMAGE_2 });
    (wrapper.vm as any).presetValue = OPENAIIMAGE_SIZE_AUTO;
    expect(committedSize(commit)).toBe(OPENAIIMAGE_SIZE_AUTO);
  });

  it('keeps auto when switching models', async () => {
    const config = reactive<Record<string, unknown>>({
      model: OPENAIIMAGE_MODEL_GPT_IMAGE_2,
      size: OPENAIIMAGE_SIZE_AUTO
    });
    const { wrapper, commit } = mountSelector(config);
    config.model = OPENAIIMAGE_MODEL_GPT_IMAGE_1;
    await wrapper.vm.$nextTick();
    expect(commit).not.toHaveBeenCalled();
    expect((wrapper.vm as any).presetValue).toBe(OPENAIIMAGE_SIZE_AUTO);
  });

  it('falls back to auto when a custom size is not valid for the new model', async () => {
    const config = reactive<Record<string, unknown>>({
      model: OPENAIIMAGE_MODEL_GPT_IMAGE_2,
      size: '2048x1152'
    });
    const { wrapper, commit } = mountSelector(config);
    config.model = OPENAIIMAGE_MODEL_GPT_IMAGE_1;
    await wrapper.vm.$nextTick();
    expect(committedSize(commit)).toBe(OPENAIIMAGE_SIZE_AUTO);
  });

  it('falls back to auto when custom mode is switched off', () => {
    const { wrapper, commit } = mountSelector({
      model: OPENAIIMAGE_MODEL_GPT_IMAGE_2,
      size: '2048x1152'
    });
    (wrapper.vm as any).useCustom = false;
    expect(committedSize(commit)).toBe(OPENAIIMAGE_SIZE_AUTO);
  });

  it('still commits explicit preset sizes untouched', () => {
    const { wrapper, commit } = mountSelector({ model: OPENAIIMAGE_MODEL_GPT_IMAGE_2 });
    (wrapper.vm as any).presetValue = '2048x2048';
    expect(committedSize(commit)).toBe('2048x2048');
  });
});

describe.each(GPT_IMAGE_25_MODELS)('OpenAIImageSizeSelector %s contract', (model) => {
  it('shares GPT Image 2 presets and custom sizing', () => {
    const { wrapper } = mountSelector({ model, size: OPENAIIMAGE_SIZE_AUTO });

    expect((wrapper.vm as any).customSupported).toBe(true);
    expect((wrapper.vm as any).presets).toContain('3840x2160');
    expect((wrapper.vm as any).presetGroups).toHaveLength(3);
  });

  it('accepts valid pixel and aspect-ratio boundaries', async () => {
    const { wrapper } = mountSelector({ model, size: OPENAIIMAGE_SIZE_AUTO });
    (wrapper.vm as any).customWidth = 640;
    (wrapper.vm as any).customHeight = 1024;
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).customError).toBe('');

    (wrapper.vm as any).customWidth = 480;
    (wrapper.vm as any).customHeight = 1440;
    await wrapper.vm.$nextTick();
    expect((wrapper.vm as any).customError).toBe('');
  });

  it('rejects too few total pixels', async () => {
    const { wrapper } = mountSelector({ model, size: OPENAIIMAGE_SIZE_AUTO });
    (wrapper.vm as any).customWidth = 464;
    (wrapper.vm as any).customHeight = 1392;
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).customError).toBe('openaiimage.error.customSizeMinPixels');
  });

  it('rejects aspect ratios wider than 3:1', async () => {
    const { wrapper } = mountSelector({ model, size: OPENAIIMAGE_SIZE_AUTO });
    (wrapper.vm as any).customWidth = 480;
    (wrapper.vm as any).customHeight = 1456;
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).customError).toBe('openaiimage.error.customSizeAspectRatio');
  });

  it('does not commit an invalid custom size', async () => {
    const { wrapper, commit } = mountSelector({ model, size: OPENAIIMAGE_SIZE_AUTO });
    (wrapper.vm as any).customWidth = 480;
    (wrapper.vm as any).customHeight = 1456;
    await wrapper.vm.$nextTick();
    (wrapper.vm as any).useCustom = true;

    expect(commit).not.toHaveBeenCalled();
  });
});
