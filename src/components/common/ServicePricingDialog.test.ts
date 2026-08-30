// @vitest-environment jsdom

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import ServicePricingDialog from './ServicePricingDialog.vue';

const translations: Record<string, string> = {
  'service.title.pricing': 'Service pricing',
  'service.title.pricingFor': 'Example pricing',
  'service.message.pricingDescription': 'Credit prices and billing rules.',
  'service.message.allRequests': 'All requests',
  'service.message.otherConfigurations': 'Other configurations',
  'service.message.free': 'Free',
  'service.message.calculated': 'Calculated from request parameters',
  'service.message.creditsAmount': '{amount} Credits',
  'service.message.creditsPerUnit': '{amount} Credits / {unit}',
  'service.message.usageMeteredPricing': 'Final charges are based on actual usage.',
  'service.message.required': 'Required',
  'service.unit.Count': 'count',
  'service.unit.Second': 'second',
  'service.unit.image': 'image',
  'service.billing.fixed': 'Fixed',
  'service.billing.free': 'Free',
  'service.billing.linear': 'Usage based',
  'service.billing.calculated': 'Calculated',
  'service.billing.usageMetered': 'Actual usage',
  'service.operator.equals': '{field}: {value}',
  'service.operator.anyOf': 'Any of: {options}',
  'service.operator.oneOf': '{field}: {value}',
  'service.condition.model': 'Model',
  'service.condition.resolution': 'Resolution',
  'service.condition.referenceVideo': 'Reference Video',
  'service.condition.action': 'Action',
  'service.condition.anyOf': 'Any of',
  'service.condition.generateAudio': 'Generate Audio'
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
        ElTableColumn: true
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

  it('marks only usage-metered estimates and explains final settlement', () => {
    const wrapper = mountDialog({
      id: 'openai',
      title: 'OpenAI',
      cost: [
        { conditions: { '==': [{ var: ['model', ''] }, 'gpt-image-2'] }, consumption: 0.11 },
        {
          conditions: { '==': [{ var: ['model', ''] }, 'gpt-image-2:official'] },
          consumption: 0.45,
          estimated: true,
          usage_metered: true
        }
      ]
    });
    const vm = wrapper.vm as any;

    expect(vm.priceLabel(vm.rows[0])).toBe('0.11 Credits');
    expect(vm.priceLabel(vm.rows[1])).toBe('Actual usage');
    expect(vm.billingLabel(vm.rows[0])).toBe('Fixed');
    expect(vm.billingLabel(vm.rows[1])).toBe('Actual usage');
    expect(vm.hasUsageMeteredPrices).toBe(true);
    expect(wrapper.text()).toContain('Final charges are based on actual usage.');
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

  it('projects condition fields into Platform-style columns and plain values', () => {
    const wrapper = mountDialog({
      id: 'suno',
      title: 'Suno',
      cost: [
        {
          conditions: {
            and: [
              { '==': [{ var: ['action', ''] }, 'generate'] },
              { in: [{ var: ['model', ''] }, ['chirp-v5-5', 'chirp-v5', 'chirp-v4']] }
            ]
          },
          consumption: 0.56
        },
        { conditions: { '==': [{ var: ['action', ''] }, 'extend'] }, consumption: 0.56 }
      ]
    });
    const vm = wrapper.vm as any;
    expect(vm.conditionColumns).toEqual([
      { key: 'action', label: 'Action' },
      { key: 'model', label: 'Model' }
    ]);
    expect(vm.conditionValue(vm.rows[0], 'action')).toBe('generate');
    expect(vm.conditionValue(vm.rows[0], 'model')).toBe('chirp-v5-5, chirp-v5, chirp-v4');
    expect(vm.conditionValue(vm.rows[1], 'model')).toBe('-');
    expect(vm.tableMinWidth).toBe(510);
  });

  it('maps internal snake-case fields to customer-facing columns', () => {
    const wrapper = mountDialog({
      id: 'video',
      title: 'Video',
      cost: [
        {
          conditions: {
            and: [
              { '==': [{ var: ['model_name', ''] }, 'video-v3'] },
              { '==': [{ var: ['generate_audio', false] }, true] }
            ]
          },
          consumption: 1
        }
      ]
    });
    const vm = wrapper.vm as any;
    expect(vm.conditionColumns).toEqual([
      { key: 'model', label: 'Model' },
      { key: 'generateAudio', label: 'Generate Audio' }
    ]);
    expect(vm.conditionValue(vm.rows[0], 'model')).toBe('video-v3');
    expect(vm.conditionValue(vm.rows[0], 'generateAudio')).toBe('true');
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
    expect(vm.tableMinWidth).toBe(340);
    expect(vm.dialogWidth).toContain('620px');
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
    expect(vm.tableMinWidth).toBe(660);
    expect(vm.dialogWidth).toContain('708px');
  });

  it('filters shared-service rows and localizes workspace unit aliases', () => {
    const wrapper = mount(ServicePricingDialog, {
      props: {
        visible: true,
        service: {
          id: 'openai',
          title: 'OpenAI',
          cost: [
            { conditions: { '==': [{ var: ['model', ''] }, 'chat-model'] }, consumption: 0 },
            {
              conditions: { '==': [{ var: ['model', ''] }, 'gpt-image-2'] },
              consumption: { '*': [0.11, { var: ['n', 1] }] }
            }
          ]
        },
        pricingModels: ['gpt-image-2'],
        pricingUnitAliases: { n: 'image' }
      },
      global: {
        mocks: {
          $t: (key: string, params: Record<string, string> = {}) =>
            (translations[key] || key).replace(/\{(\w+)\}/g, (_, name) => params[name] || `{${name}}`)
        },
        stubs: { ElDialog: { template: '<div><slot /></div>' }, ElTable: true, ElTableColumn: true }
      }
    });
    const vm = wrapper.vm as any;
    expect(vm.rows).toHaveLength(1);
    expect(vm.rows[0].conditions[0].value).toBe('gpt-image-2');
    expect(vm.priceLabel(vm.rows[0])).toBe('0.11 Credits / image');
  });

  it('shows only OpenAI Image workspace models with a localized image unit', () => {
    const wrapper = mount(ServicePricingDialog, {
      props: {
        visible: true,
        service: {
          id: 'openai',
          title: 'OpenAI',
          cost: [
            {
              conditions: {
                and: [
                  { '==': [{ var: ['model', 'dall-e-3'] }, 'dall-e-3'] },
                  { '==': [{ var: ['quality', 'standard'] }, 'standard'] }
                ]
              },
              consumption: { '*': [0.2, { var: ['n', 1] }] }
            },
            {
              conditions: { '==': [{ var: ['model', 'dall-e-3'] }, 'gpt-image-2'] },
              consumption: { '*': [0.11, { var: ['n', 1] }] }
            },
            { conditions: { '==': [{ var: ['model', ''] }, 'gpt-image-1'] }, consumption: 0.36 },
            {
              conditions: { '==': [{ var: ['model', 'dall-e-3'] }, 'gpt-image-1'] },
              consumption: { '*': [0.2, { var: ['n', 1] }] }
            }
          ]
        },
        pricingModels: ['gpt-image-1', 'gpt-image-2'],
        pricingModelDefault: 'dall-e-3',
        pricingUnitAliases: { n: 'image' }
      },
      global: {
        mocks: {
          $t: (key: string, params: Record<string, string> = {}) =>
            (translations[key] || key).replace(/\{(\w+)\}/g, (_, name) => params[name] || `{${name}}`)
        },
        stubs: { ElDialog: { template: '<div><slot /></div>' }, ElTable: true, ElTableColumn: true }
      }
    });
    const vm = wrapper.vm as any;
    expect(vm.rows).toHaveLength(2);
    expect(vm.rows.map((row: any) => row.conditions[0].value)).toEqual(['gpt-image-2', 'gpt-image-1']);
    expect(vm.rows.map((row: any) => vm.priceLabel(row))).toEqual(['0.11 Credits / image', '0.20 Credits / image']);
    expect(JSON.stringify(vm.rows)).not.toContain('dall-e-3');
    expect(JSON.stringify(vm.rows)).not.toContain('quality');
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
