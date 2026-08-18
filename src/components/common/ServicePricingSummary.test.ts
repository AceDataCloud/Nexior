// @vitest-environment jsdom

import { shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ServicePricingSummary from './ServicePricingSummary.vue';

const service = {
  id: 'service-1',
  title: 'Example',
  unit: 'credits',
  cost: [{ conditions: {}, consumption: 0.14 }]
};

function mountSummary(props: Record<string, unknown> = {}) {
  return shallowMount(ServicePricingSummary, {
    props: { value: 0.14, service, ...props },
    global: {
      mocks: { $t: (key: string) => (key === 'service.button.pricing' ? 'Pricing' : key) },
      stubs: {
        Consumption: { template: '<span class="consumption-stub">0.14 Credits</span>' },
        ServicePricingDialog: { props: ['visible'], template: '<div class="dialog-stub" :data-visible="visible" />' }
      }
    }
  });
}

afterEach(() => vi.unstubAllEnvs());

describe('ServicePricingSummary', () => {
  it('shows the estimate and accessible pricing button on one line', async () => {
    const wrapper = mountSummary();
    expect(wrapper.find('.consumption-stub').exists()).toBe(true);
    const button = wrapper.get('button');
    expect(button.text()).toBe('Pricing');
    await button.trigger('click');
    expect(wrapper.get('.dialog-stub').attributes('data-visible')).toBe('true');
  });

  it('keeps pricing available when the current estimate is hidden', () => {
    const wrapper = mountSummary({ showConsumption: false });
    expect(wrapper.find('.consumption-stub').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('hides pricing when no visible rules exist', () => {
    const wrapper = mountSummary({ service: { ...service, cost: [{ hidden: true, conditions: {}, consumption: 1 }] } });
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('keeps the estimate but hides the paid catalog on iOS', () => {
    vi.stubEnv('VITE_SURFACE', 'ios');
    const wrapper = mountSummary();
    expect(wrapper.find('.consumption-stub').exists()).toBe(true);
    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.find('.dialog-stub').exists()).toBe(false);
  });
});
