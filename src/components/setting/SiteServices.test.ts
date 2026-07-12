// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const operatorMocks = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  getOverrides: vi.fn(),
  updateSite: vi.fn(),
  showError: vi.fn()
}));

vi.mock('@/operators', () => ({
  serviceOperator: { getAll: operatorMocks.getCatalog },
  siteOperator: { update: operatorMocks.updateSite },
  siteServiceOverrideOperator: {
    getAll: operatorMocks.getOverrides,
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessage: {
      error: operatorMocks.showError,
      success: vi.fn()
    }
  };
});

import SiteServicesSetting from './SiteServices.vue';

const site = {
  id: 'site-1',
  metadata: {
    support_url: 'https://support.example.com',
    pricing: {
      applies_to: 'all',
      markup_ratio: 0.1234
    }
  }
};

const dispatch = vi.fn();
const translate = vi.fn((key: string) => key);

const mountComponent = () =>
  shallowMount(SiteServicesSetting, {
    global: {
      mocks: {
        $t: translate,
        $store: {
          getters: { site },
          dispatch
        }
      },
      stubs: {
        SectionNotice: true,
        ElDialog: {
          template: '<div><slot /><slot name="footer" /></div>'
        },
        ElCard: {
          template: '<div><slot /></div>'
        },
        ElTable: {
          template: '<div><slot /></div>'
        },
        ElTableColumn: {
          props: ['label'],
          template: '<div class="table-column-stub" :data-label="label" />'
        },
        ElForm: {
          template: '<form><slot /></form>'
        },
        ElFormItem: {
          props: ['label'],
          template: '<div class="form-item-stub" :data-label="label"><slot /></div>'
        }
      }
    }
  });

describe('setting/SiteServices pricing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    operatorMocks.getCatalog.mockResolvedValue({ data: { items: [] } });
    operatorMocks.getOverrides.mockResolvedValue({ data: { items: [] } });
    operatorMocks.updateSite.mockResolvedValue({ data: site });
    dispatch.mockResolvedValue(site);
    translate.mockClear();
  });

  it('shows the site-wide markup without a sample-price input or example', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    await wrapper.setData({
      loading: false,
      rows: [{ id: 'override-1', service: 'service-1', visible: true }]
    });

    expect((wrapper.vm as unknown as { siteMarkupPercent: number }).siteMarkupPercent).toBe(12.34);
    expect(wrapper.find('.default-price-section').exists()).toBe(true);
    expect(translate).toHaveBeenCalledWith('site.field.markupRatio');
    expect(
      wrapper
        .findAll('.table-column-stub')
        .some((column) => column.attributes('data-label') === 'site.services.field.customMarkupRatio')
    ).toBe(true);
    expect(
      wrapper
        .findAll('.form-item-stub')
        .some((item) => item.attributes('data-label') === 'site.services.field.customMarkupRatio')
    ).toBe(true);
    expect(wrapper.text()).not.toContain('site.services.preview.sampleLabel');
    expect(wrapper.text()).not.toContain('site.message.markupExample');
  });

  it('saves a precise site-wide markup while preserving other metadata', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as unknown as { onSaveSiteMarkup: (percent: number) => Promise<void> }).onSaveSiteMarkup(12.34);

    expect(operatorMocks.updateSite).toHaveBeenCalledWith('site-1', {
      ...site,
      metadata: {
        support_url: 'https://support.example.com',
        pricing: {
          applies_to: 'all',
          markup_ratio: 0.1234
        }
      }
    });
    expect(dispatch).toHaveBeenCalledWith('getSite');
  });

  it('serializes rapid changes so the latest markup is persisted last', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    const vm = wrapper.vm as unknown as { onSaveSiteMarkup: (percent: number) => Promise<void> };

    const firstSave = vm.onSaveSiteMarkup(20);
    const latestSave = vm.onSaveSiteMarkup(30);
    await Promise.all([firstSave, latestSave]);

    expect(operatorMocks.updateSite).toHaveBeenCalledTimes(2);
    expect(operatorMocks.updateSite.mock.calls.map((call) => call[1].metadata.pricing.markup_ratio)).toEqual([
      0.2, 0.3
    ]);
    expect(dispatch).toHaveBeenCalledTimes(1);
  });

  it('reports a failed save and restores the last confirmed markup', async () => {
    operatorMocks.updateSite.mockRejectedValueOnce(new Error('network failure'));
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as unknown as { onSaveSiteMarkup: (percent: number) => Promise<void> }).onSaveSiteMarkup(45);

    expect(operatorMocks.showError).toHaveBeenCalledWith('site.services.message.saveFailed');
    expect((wrapper.vm as unknown as { siteMarkupDraftPercent: number }).siteMarkupDraftPercent).toBe(12.34);
    expect(dispatch).toHaveBeenCalledWith('getSite');
  });

  it('keeps the saved markup when the post-save refresh fails', async () => {
    dispatch.mockResolvedValueOnce(undefined);
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as unknown as { onSaveSiteMarkup: (percent: number) => Promise<void> }).onSaveSiteMarkup(45);

    expect(operatorMocks.updateSite).toHaveBeenCalledTimes(1);
    expect(operatorMocks.showError).toHaveBeenCalledWith('site.services.message.fetchFailed');
    expect((wrapper.vm as unknown as { siteMarkupDraftPercent: number }).siteMarkupDraftPercent).toBe(45);
  });

  it('rolls back to the last persisted markup across consecutive refresh and save failures', async () => {
    dispatch.mockResolvedValue(undefined);
    operatorMocks.updateSite.mockResolvedValueOnce({ data: site }).mockRejectedValueOnce(new Error('save failure'));
    const wrapper = mountComponent();
    await flushPromises();
    const vm = wrapper.vm as unknown as {
      onSaveSiteMarkup: (percent: number) => Promise<void>;
      siteMarkupDraftPercent: number;
      siteMarkupConfirmedPercent: number;
    };

    await vm.onSaveSiteMarkup(45);
    expect(vm.siteMarkupConfirmedPercent).toBe(45);

    await vm.onSaveSiteMarkup(60);
    expect(vm.siteMarkupDraftPercent).toBe(45);
    expect(vm.siteMarkupConfirmedPercent).toBe(45);
  });
});
