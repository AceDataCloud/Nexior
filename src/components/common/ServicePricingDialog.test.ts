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
  'service.message.required': 'Required',
  'service.unit.Count': 'count',
  'service.unit.Second': 'second',
  'service.billing.fixed': 'Fixed',
  'service.billing.free': 'Free',
  'service.billing.linear': 'Usage based',
  'service.billing.calculated': 'Calculated',
  'service.operator.equals': '{field}: {value}',
  'service.operator.anyOf': 'Any of: {options}',
  'service.operator.oneOf': '{field}: {value}',
  'service.condition.model': 'Model',
  'service.condition.resolution': 'Resolution',
  'service.condition.referenceVideo': 'Reference Video'
};

function mountDialog(service: any) {
  return mount(ServicePricingDialog, {
    props: { visible: true, service },
    global: {
      mocks: {
        $t: (key: string, params: Record<string, string> = {}) =>
          (translations[key] || key).replace(/\{(\w+)\}/g, (_, name) => params[name] || `{${name}}`)
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

  it('renders Seedance reference-video rules without generic fallback text', () => {
    const wrapper = mountDialog({
      id: 'seedance',
      title: 'Seedance',
      cost: [
        {
          conditions: {
            and: [
              { in: ['doubao-seedance-2-0-mini', { var: ['model', ''] }] },
              { '==': [{ var: ['resolution', '480p'] }, '480p'] },
              { some: [{ var: ['content', []] }, { in: ['reference_video', { var: ['role', ''] }] }] }
            ]
          },
          consumption: { '*': [0.95, { var: ['duration', 5] }] },
          unit: 'Second'
        }
      ]
    });
    const vm = wrapper.vm as any;
    const labels = vm.rows[0].conditions.map((condition: any) => vm.formatCondition(condition));
    expect(labels).toEqual(['Model: doubao-seedance-2-0-mini', 'Resolution: 480p', 'Reference Video: Required']);
    expect(labels.join(' ')).not.toContain('Other configurations');
    expect(vm.showBillingMethod).toBe(false);
    expect(vm.showRemarks).toBe(false);
  });

  it('hides billing and notes columns when every row repeats the same empty values', () => {
    const wrapper = mountDialog({
      id: 'service-1',
      title: 'Example',
      cost: [
        { conditions: {}, consumption: { '*': [0.5, { var: ['duration', 5] }] }, unit: 'Second' },
        { conditions: {}, consumption: { '*': [0.8, { var: ['duration', 5] }] }, unit: 'Second' }
      ]
    });
    const vm = wrapper.vm as any;
    expect(vm.showBillingMethod).toBe(false);
    expect(vm.showRemarks).toBe(false);
    expect(vm.compactTable).toBe(true);
    expect(vm.dialogWidth).toContain('680px');
  });

  it('keeps informative columns when values differ or notes exist', () => {
    const wrapper = mountDialog({
      id: 'service-1',
      title: 'Example',
      cost: [
        { conditions: {}, consumption: 0, remark: 'Welcome tier' },
        { conditions: {}, consumption: 1 }
      ]
    });
    const vm = wrapper.vm as any;
    expect(vm.showBillingMethod).toBe(true);
    expect(vm.showRemarks).toBe(true);
    expect(vm.compactTable).toBe(false);
    expect(vm.dialogWidth).toContain('880px');
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
