// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ConfigPanel from './ConfigPanel.vue';
import ImageInput from './config/ImageInput.vue';
import ModelSelector from './config/ModelSelector.vue';

const getConsumptionMock = vi.hoisted(() => vi.fn((_request: Record<string, unknown>) => 1));

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  getConsumption: getConsumptionMock
}));

const mountPanel = (image: string[] = [], model = 'doubao-seedream-4-5-251128') => {
  const config = reactive({
    model,
    image
  });
  const wrapper = shallowMount(ConfigPanel, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: {
            seedream: {
              config,
              service: { cost: [] }
            }
          }
        }
      }
    }
  });
  return { config, wrapper };
};

describe('seedream/ConfigPanel', () => {
  beforeEach(() => {
    getConsumptionMock.mockClear();
  });

  it('shows reference image upload without create/edit tabs', () => {
    const { wrapper } = mountPanel();

    expect(wrapper.find('.action-selector').exists()).toBe(false);
    expect(wrapper.findComponent(ImageInput).exists()).toBe(true);
    expect(wrapper.findComponent(ModelSelector).exists()).toBe(true);

    const { wrapper: textOnlyWrapper } = mountPanel([], 'doubao-seedream-3-0-t2i-250415');
    expect(textOnlyWrapper.findComponent(ImageInput).exists()).toBe(false);
  });

  it('automatically switches billing mode when references change', async () => {
    const { config, wrapper } = mountPanel();

    expect((wrapper.vm as unknown as { action: string }).action).toBe('generate');
    expect(getConsumptionMock.mock.lastCall?.[0]).toMatchObject({ action: 'generate', input_image_count: 0 });

    config.image = ['https://cdn.example/reference.png'];
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as unknown as { action: string }).action).toBe('edit');
    expect(getConsumptionMock.mock.lastCall?.[0]).toMatchObject({ action: 'edit', input_image_count: 1 });
  });
});
