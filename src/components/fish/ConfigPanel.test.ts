// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ConfigPanel from './ConfigPanel.vue';

const getConsumptionMock = vi.hoisted(() => vi.fn(() => 0.033084));

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  getConsumption: getConsumptionMock
}));

describe('fish/ConfigPanel', () => {
  beforeEach(() => {
    getConsumptionMock.mockClear();
  });

  it('prices text using its UTF-8 byte count and the default model', () => {
    shallowMount(ConfigPanel, {
      global: {
        mocks: {
          $t: (key: string) => key,
          $store: {
            state: {
              fish: {
                config: { text: `  ${'啦'.repeat(100)}  ` },
                service: { cost: [] }
              }
            }
          }
        }
      }
    });

    expect(getConsumptionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 's2-pro',
        byte_count: 300
      }),
      []
    );
  });
});
