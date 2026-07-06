// @vitest-environment jsdom
import { shallowMount, flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const siteDomainOperatorMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
  verify: vi.fn(),
  delete: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteDomainOperator: siteDomainOperatorMock
}));

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessage: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn()
    },
    ElMessageBox: {
      confirm: vi.fn()
    }
  };
});

import CustomDomainSetting from './CustomDomain.vue';
import { SiteDomainStatus, type ISiteDomain } from '@/models';

const pendingDomain: ISiteDomain = {
  id: 'domain-1',
  site: 'site-1',
  hostname: 'studio.example.com',
  status: SiteDomainStatus.Pending,
  proxy_cname: 'tenant-proxy.acedata.cloud'
};

const mountComponent = () =>
  shallowMount(CustomDomainSetting, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: {
            site: { id: 'site-1', metadata: {} }
          }
        }
      },
      stubs: {
        SectionNotice: true
      }
    }
  });

describe('setting/CustomDomain', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siteDomainOperatorMock.getAll.mockResolvedValue({ data: { items: [] } });
  });

  it('shows CNAME instructions from proxy_cname when the list response omits dns_instructions', async () => {
    siteDomainOperatorMock.getAll.mockResolvedValueOnce({ data: { items: [pendingDomain] } });

    const wrapper = mountComponent();
    await flushPromises();

    const displayDomains = (wrapper.vm as unknown as { displayDomains: ISiteDomain[] }).displayDomains;
    expect(displayDomains).toHaveLength(1);
    expect(displayDomains[0].dns_instructions).toMatchObject({
      record_type: 'CNAME',
      record_name: 'studio.example.com',
      record_value: 'tenant-proxy.acedata.cloud'
    });
  });

  it('refreshes the list instead of inserting an invalid row when create returns no domain body', async () => {
    siteDomainOperatorMock.getAll
      .mockResolvedValueOnce({ data: { items: [] } })
      .mockResolvedValueOnce({ data: { items: [pendingDomain] } });
    siteDomainOperatorMock.create.mockResolvedValueOnce({ data: undefined });

    const wrapper = mountComponent();
    await flushPromises();

    await wrapper.setData({ bind: { hostname: 'studio.example.com' } });
    await (wrapper.vm as unknown as { onBind: () => Promise<void> }).onBind();
    await flushPromises();

    const rawDomains = (wrapper.vm as unknown as { domains: ISiteDomain[] }).domains;
    expect(rawDomains).toEqual([pendingDomain]);
    expect(siteDomainOperatorMock.getAll).toHaveBeenCalledTimes(2);
    expect(siteDomainOperatorMock.create).toHaveBeenCalledWith({
      site: 'site-1',
      hostname: 'studio.example.com'
    });
  });
});
