// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const gate = vi.hoisted(() => ({
  enabled: false,
  states: {} as Record<string, { mode: 'credits' | 'wallet'; quoteUsdc?: string; quoteLoading: boolean }>
}));

vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => gate.enabled,
  scenarioPaymentState: (scenario: string) => {
    if (!gate.states[scenario]) gate.states[scenario] = reactive({ mode: 'credits', quoteLoading: false });
    return gate.states[scenario];
  }
}));

import ScenarioPaymentMode from './ScenarioPaymentMode.vue';

function mountComponent(scenario = 'nanobanana') {
  return shallowMount(ScenarioPaymentMode, {
    props: { scenario },
    global: { mocks: { $t: (key: string) => key } }
  });
}

describe('ScenarioPaymentMode', () => {
  beforeEach(() => {
    gate.enabled = false;
    gate.states = {};
  });

  it('renders nothing while x402 or wallet mode is disabled', () => {
    expect(mountComponent().find('.scenario-wallet-price').exists()).toBe(false);
    gate.enabled = true;
    expect(mountComponent().find('.scenario-wallet-price').exists()).toBe(false);
  });

  it('shows only the authoritative USDC quote in wallet mode', async () => {
    gate.enabled = true;
    const wrapper = mountComponent();
    gate.states.nanobanana.mode = 'wallet';
    gate.states.nanobanana.quoteUsdc = '0.095215';
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('0.095215 USDC');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('reads quote state for its own scenario only', async () => {
    gate.enabled = true;
    const nano = mountComponent('nanobanana');
    const openAI = mountComponent('openaiimage');
    gate.states.nanobanana.mode = 'wallet';
    gate.states.nanobanana.quoteUsdc = '0.1';
    await nano.vm.$nextTick();

    expect(nano.text()).toContain('0.1 USDC');
    expect(openAI.text()).not.toContain('USDC');
  });
});
