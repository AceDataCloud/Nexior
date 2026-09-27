// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateSite: vi.fn().mockResolvedValue({ data: {} }),
  getOverrides: vi.fn().mockResolvedValue({ data: { count: 0, items: [] } }),
  getSite: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteOperator: { get: mocks.getSite, update: mocks.updateSite },
  siteCapabilityOverrideOperator: { getAll: mocks.getOverrides }
}));

import FunctionSetting from './Function.vue';

describe('FunctionSetting', () => {
  beforeEach(() => vi.clearAllMocks());
  it('patches only the owned features field', async () => {
    const site = {
      id: 'site-1',
      configuration_revision: 7,
      features: { chatgpt: { enabled: true, models: { 'gpt-5.5': { display_name: 'XXAI-Pro' } } } },
      capability_overrides: {
        chatgpt: { display_name: 'Custom Chat', icon_url: 'https://cdn.example.com/chat.png' }
      }
    };
    mocks.getSite.mockResolvedValue({ data: site });
    mocks.updateSite.mockResolvedValue({ data: { ...site, configuration_revision: 8 } });
    const dispatch = vi.fn().mockResolvedValue(undefined);
    const wrapper = shallowMount(FunctionSetting, {
      global: {
        mocks: {
          $store: {
            getters: { site },
            dispatch
          },
          $t: (key: string) => key
        },
        stubs: {
          CapabilityOverrideDialog: true,
          ElButton: true,
          ElSwitch: true,
          ElTooltip: true,
          SectionNotice: true
        }
      }
    });

    await (
      wrapper.vm as unknown as {
        updateFeature: (feature: string, updates: Record<string, unknown>) => Promise<void>;
      }
    ).updateFeature('chatgpt', { enabled: false });

    expect(mocks.updateSite).toHaveBeenCalledWith(
      'site-1',
      {
        features: {
          chatgpt: { enabled: false, models: { 'gpt-5.5': { display_name: 'XXAI-Pro' } } }
        }
      },
      7
    );
    expect(dispatch).toHaveBeenCalledWith('getSite');
  });
});
