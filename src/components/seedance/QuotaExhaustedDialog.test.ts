// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import QuotaExhaustedDialog from './QuotaExhaustedDialog.vue';

const mountDialog = (props: Record<string, unknown> = {}) =>
  shallowMount(QuotaExhaustedDialog, {
    props: {
      modelValue: true,
      estimatedConsumption: 8.4,
      availableCredits: 2,
      balanceState: 'current',
      unit: 'Credit',
      canTopUp: true,
      ...props
    },
    global: {
      mocks: { $t: (key: string) => key },
      stubs: {
        ElDialog: { template: '<section><slot /><slot name="footer" /></section>' },
        ElButton: { template: '<button><slot /></button>' },
        ElIcon: { template: '<i><slot /></i>' },
        Loading: true
      }
    }
  });

describe('SeedanceQuotaExhaustedDialog', () => {
  it('shows the submitted estimate and refreshed available credits', () => {
    const wrapper = mountDialog();
    expect(wrapper.text()).toContain('8.40 service.unit.Credits');
    expect(wrapper.text()).toContain('2.00 service.unit.Credits');
  });

  it('shows refresh and unavailable states without stale values', () => {
    expect(mountDialog({ balanceState: 'refreshing', availableCredits: undefined }).text()).toContain(
      'seedance.quotaDialog.refreshing'
    );
    const unavailable = mountDialog({ balanceState: 'unavailable', availableCredits: undefined });
    expect(unavailable.text()).toContain('seedance.quotaDialog.unavailable');
    expect(unavailable.text()).not.toContain('2.00');
  });

  it('emits top-up only when the action is available', async () => {
    const wrapper = mountDialog();
    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('click');
    expect(wrapper.emitted('topUp')).toHaveLength(1);
    expect(mountDialog({ canTopUp: false }).findAll('button')).toHaveLength(1);
  });

  it('uses a phone-safe maximum width', () => {
    expect((mountDialog().vm as unknown as { dialogWidth: string }).dialogWidth).toBe('min(500px, 94vw)');
  });
});
