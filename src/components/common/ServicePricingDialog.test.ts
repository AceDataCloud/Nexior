// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ServicePricingDialog from './ServicePricingDialog.vue';

const translations: Record<string, string> = {
  'service.title.pricing': 'Service pricing',
  'service.title.pricingFor': 'Example pricing',
  'service.message.pricingDescription': 'Full visible pricing rules.',
  'service.message.allRequests': 'All requests',
  'service.message.otherConfigurations': 'Other configurations',
  'service.message.free': 'Free',
  'service.message.calculated': 'Calculated from request parameters',
  'service.message.creditsAmount': '{amount} Credits',
  'service.message.creditsPerUnit': '{amount} Credits / {unit}',
  'service.unit.Count': 'count',
  'service.unit.Second': 'second',
  'service.billing.fixed': 'Fixed',
  'service.billing.free': 'Free',
  'service.billing.linear': 'Usage based',
  'service.billing.calculated': 'Calculated',
  'service.operator.equals': 'Model: video-pro',
  'service.condition.model': 'Model'
};

function mountDialog(service: any) {
  return mount(ServicePricingDialog, {
    props: { visible: true, service },
    global: {
      mocks: {
        $t: (key: string, params: Record<string, string> = {}) =>
          (translations[key] || key).replace(/\{(\w+)\}/g, (_, name) => params[name] || `{${name}}`),
        $te: (key: string) => key in translations
      },
      stubs: {
        ElDialog: { template: '<div><slot /></div>' },
        ElSkeleton: { template: '<div class="loading" />' },
        ElEmpty: { props: ['description'], template: '<div class="empty">{{ description }}</div>' },
        ElTable: { template: '<div class="table"><slot /></div>' },
        ElTableColumn: true,
        ElTag: { template: '<span><slot /></span>' }
      }
    }
  });
}

describe('ServicePricingDialog', () => {
  it('normalizes and renders pricing without exposing JsonLogic', () => {
    const wrapper = mountDialog({
      id: 'service-1',
      title: 'Example',
      cost: [
        { conditions: { '==': [{ var: ['model', ''] }, 'video-pro'] }, consumption: 0.14 },
        { hidden: true, conditions: {}, consumption: 99 }
      ]
    });
    const vm = wrapper.vm as any;
    expect(vm.rows).toHaveLength(1);
    expect(vm.formatCondition(vm.rows[0].conditions[0])).toBe('Model: video-pro');
    expect(vm.priceLabel(vm.rows[0])).toBe('0.14 Credits');
    expect(JSON.stringify(vm.rows)).not.toContain('99');
    expect(JSON.stringify(vm.rows)).not.toContain('\"var\"');
  });

  it('shows an explicit unit for fixed per-unit rules', () => {
    const wrapper = mountDialog({
      id: 'service-1',
      title: 'Example',
      cost: [{ conditions: {}, consumption: 0.01, unit: 'Count' }]
    });
    const vm = wrapper.vm as any;
    expect(vm.priceLabel(vm.rows[0])).toBe('0.01 Credits / count');
  });

  it('shows loading and empty states', () => {
    expect(mountDialog(undefined).find('.loading').exists()).toBe(true);
    expect(mountDialog({ id: 'service-1', title: 'Example', cost: [] }).find('.empty').exists()).toBe(true);
  });
});
