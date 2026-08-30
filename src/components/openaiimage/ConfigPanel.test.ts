// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ConfigPanel from './ConfigPanel.vue';
import { OPENAIIMAGE_MODEL_GPT_IMAGE_2, OPENAIIMAGE_MODEL_GPT_IMAGE_2_OFFICIAL } from '@/constants';

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
        $t: (key: string) =>
          key === 'service.message.imageTokenEstimate' ? 'Estimate only; final charges use actual tokens.' : key
      }
    }
  });
}

describe('OpenAI Image ConfigPanel pricing', () => {
  it('shows the token-settlement note only for the official model', () => {
    const official = mountPanel(OPENAIIMAGE_MODEL_GPT_IMAGE_2_OFFICIAL);
    const standard = mountPanel(OPENAIIMAGE_MODEL_GPT_IMAGE_2);

    expect((official.vm as any).pricingNote).toBe('Estimate only; final charges use actual tokens.');
    expect((standard.vm as any).pricingNote).toBe('');
    expect(official.findComponent({ name: 'ServicePricingSummary' }).props('note')).toBe(
      'Estimate only; final charges use actual tokens.'
    );
    expect(standard.findComponent({ name: 'ServicePricingSummary' }).props('note')).toBe('');
  });
});
