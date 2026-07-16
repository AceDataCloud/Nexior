// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  updateSite: vi.fn().mockResolvedValue({ data: {} }),
  getOverrides: vi.fn().mockResolvedValue({ data: { count: 0, items: [] } })
}));

vi.mock('@/operators', () => ({
  siteOperator: { update: mocks.updateSite },
  siteCapabilityOverrideOperator: { getAll: mocks.getOverrides }
}));

import FunctionSetting from './Function.vue';

describe('FunctionSetting', () => {
  it('does not echo the read-only capability override mapping in Site PUTs', async () => {
    const site = {
      id: 'site-1',
      title: 'Demo',
      features: { chatgpt: { enabled: true } },
      capability_overrides: {
        chatgpt: { display_name: 'Custom Chat', icon_url: 'https://cdn.example.com/chat.png' }
      }
    };
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

    (wrapper.vm as unknown as { onToggleFeature: (feature: string, enabled: boolean) => void }).onToggleFeature(
      'chatgpt',
      false
    );
    await Promise.resolve();

    expect(mocks.updateSite).toHaveBeenCalledWith('site-1', {
      id: 'site-1',
      title: 'Demo',
      features: { chatgpt: { enabled: false } }
    });
    expect(dispatch).toHaveBeenCalledWith('getSite');
  });
});
