// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { reactive } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const gate = vi.hoisted(() => ({
  enabled: false,
  states: {} as Record<string, { mode: 'credits' | 'wallet'; quoteUsdc?: string; quoteLoading: boolean }>,
  errors: {} as Record<string, Record<string, unknown> | undefined>
}));

vi.mock('@/utils/x402/scenarioPayment', () => ({
  isScenarioX402Enabled: () => gate.enabled,
  scenarioPaymentState: (scenario: string) => {
    if (!gate.states[scenario]) gate.states[scenario] = reactive({ mode: 'credits', quoteLoading: false });
    return gate.states[scenario];
  }
}));

vi.mock('@/utils/x402/paymentErrorState', () => ({
  scenarioPaymentError: (scenario: string) => gate.errors[scenario]
}));

vi.mock('@acedatacloud/core/x402', () => ({
  resolveX402PaymentError: (error: Record<string, unknown>) => error
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
    gate.errors = {};
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

  it('renders a compact semantic payment error with all recovery details', async () => {
    gate.enabled = true;
    const wrapper = mountComponent();
    gate.states.nanobanana.mode = 'wallet';
    gate.states.nanobanana.quoteUsdc = '0.012263';
    gate.errors.nanobanana = {
      title: 'Payment incomplete',
      description: 'The payment could not be completed.',
      safety: 'Verification failed; no charge was initiated.',
      nextStep: 'Check the wallet and network, then retry.',
      technicalCode: 'Technical code: payment_failed',
      severity: 'error'
    };
    await wrapper.vm.$nextTick();

    const alert = wrapper.get('[role="alert"]');
    expect(alert.classes()).toContain('scenario-payment-error');
    expect(alert.classes()).toContain('is-error');
    expect(alert.get('.scenario-error-title').text()).toBe('Payment incomplete');
    expect(alert.get('.scenario-error-description').text()).toBe('The payment could not be completed.');
    expect(alert.get('.scenario-error-safety').text()).toContain('no charge was initiated');
    expect(alert.get('.scenario-error-next-step').text()).toContain('then retry');
    expect(alert.get('.scenario-error-code').text()).toBe('Technical code: payment_failed');
    expect(alert.findComponent({ name: 'ErrorIcon' }).exists()).toBe(true);
  });

  it('does not render an empty error card when payment has no error', async () => {
    gate.enabled = true;
    const wrapper = mountComponent();
    gate.states.nanobanana.mode = 'wallet';
    gate.states.nanobanana.quoteUsdc = '0.012263';
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[role="alert"]').exists()).toBe(false);
    expect(wrapper.text()).toContain('0.012263 USDC');
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
