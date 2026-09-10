// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConfigPanel from './ConfigPanel.vue';
import {
  OPENAIIMAGE_MODEL_GPT_IMAGE_2,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE_OFFICIAL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST,
  OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST_OFFICIAL,
  OPENAIIMAGE_MODEL_GPT_IMAGE_2_OFFICIAL
} from '@/constants';

function mountPanel(model: string) {
  return shallowMount(ConfigPanel, {
    global: {
      mocks: {
        $store: {
          state: {
            openaiimage: {
              config: { model },
              service: { id: 'openai', title: 'OpenAI', cost: [] }
            }
          }
        },
        $t: (key: string) => (key === 'service.message.imageTokenEstimate' ? 'Final charges use actual tokens.' : key)
      }
    }
  });
}

describe('OpenAI Image ConfigPanel pricing', () => {
  it.each([
    OPENAIIMAGE_MODEL_GPT_IMAGE_2_OFFICIAL,
    OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE_OFFICIAL,
    OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST_OFFICIAL
  ])('shows the token-settlement note for official model %s', (model) => {
    const official = mountPanel(model);

    expect((official.vm as any).pricingNote).toBe('Final charges use actual tokens.');
    expect((official.vm as any).displayConsumption).toBeUndefined();
    expect(official.findComponent({ name: 'ServicePricingSummary' }).props('note')).toBe(
      'Final charges use actual tokens.'
    );
  });

  it('keeps fixed pricing display for the default model', () => {
    const standard = mountPanel(OPENAIIMAGE_MODEL_GPT_IMAGE_2);

    expect((standard.vm as any).pricingNote).toBe('');
    expect((standard.vm as any).displayConsumption).toBe(0);
    expect(standard.findComponent({ name: 'ServicePricingSummary' }).props('note')).toBe('');
  });

  it.each([OPENAIIMAGE_MODEL_GPT_IMAGE_25_FLARE, OPENAIIMAGE_MODEL_GPT_IMAGE_25_SUNBURST])(
    'uses fixed pricing display for %s',
    (model) => {
      const panel = mountPanel(model);

      expect((panel.vm as any).pricingNote).toBe('');
      expect((panel.vm as any).displayConsumption).toBe(0);
    }
  );
});
