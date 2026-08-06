// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const gate = vi.hoisted(() => ({
  enabled: false,
  paymentMode: { value: 'credits' as 'credits' | 'wallet' }
}));

vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => gate.enabled,
  scenarioPaymentMode: gate.paymentMode
}));

import ScenarioPaymentMode from './ScenarioPaymentMode.vue';

function mountComponent() {
  return shallowMount(ScenarioPaymentMode, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $wallet: {
          connected: ref(false),
          publicKey: ref(null),
          wallet: ref(null),
          wallets: ref([])
        }
      },
      stubs: {
        ElButton: true,
        ElDialog: true,
        ElRadioButton: true,
        ElRadioGroup: true
      }
    }
  });
}

describe('ScenarioPaymentMode', () => {
  beforeEach(() => {
    gate.enabled = false;
    gate.paymentMode.value = 'credits';
  });

  it('renders nothing while the x402 feature is disabled', () => {
    expect(mountComponent().find('.scenario-payment').exists()).toBe(false);
  });

  it('defaults to Credits and switches only after the feature is enabled', async () => {
    gate.enabled = true;
    const wrapper = mountComponent();
    expect(wrapper.find('.scenario-payment').exists()).toBe(true);
    expect((wrapper.vm as any).mode).toBe('credits');

    (wrapper.vm as any).mode = 'wallet';
    await wrapper.vm.$nextTick();

    expect(gate.paymentMode.value).toBe('wallet');
    expect(wrapper.emitted('change')?.[0]).toEqual(['wallet']);
  });
});
