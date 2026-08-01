// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const siteOperatorMock = vi.hoisted(() => ({
  getAll: vi.fn(),
  create: vi.fn(),
  delete: vi.fn()
}));

const siteDomainOperatorMock = vi.hoisted(() => ({
  getAll: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteOperator: siteOperatorMock,
  siteDomainOperator: siteDomainOperatorMock
}));

import SubsiteSetting from './Subsite.vue';
import { SiteDomainStatus, type ISite } from '@/models';

const site: ISite = {
  id: 'site-1',
  origin: 'brand.studio.acedata.cloud'
};

const mountComponent = () =>
  shallowMount(SubsiteSetting, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: {
            site: {
              origin: 'studio.acedata.cloud',
              features: { subsite: { subdomain_zone: 'studio.acedata.cloud' } }
            }
          },
          getters: { user: { id: 'user-1' } }
        }
      },
      stubs: {
        Plus: true,
        SectionNotice: true
      }
    }
  });

describe('setting/Subsite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siteOperatorMock.getAll.mockResolvedValue({ data: { items: [] } });
    siteDomainOperatorMock.getAll.mockResolvedValue({ data: { items: [] } });
  });

  it('opens settings on an active custom domain', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = mountComponent();
    await flushPromises();
    await wrapper.setData({
      domainsBySite: {
        'site-1': [
          { hostname: 'pending.example.com', status: SiteDomainStatus.Pending },
          { hostname: 'studio.example.com', status: SiteDomainStatus.Active }
        ]
      }
    });

    (wrapper.vm as unknown as { onManageSite: (row: ISite) => void }).onManageSite(site);

    expect(open).toHaveBeenCalledWith('https://studio.example.com/?dialog=settings', '_blank', 'noopener');
  });

  it('falls back to the default subdomain when no custom domain is active', async () => {
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = mountComponent();
    await flushPromises();
    await wrapper.setData({
      domainsBySite: {
        'site-1': [{ hostname: 'pending.example.com', status: SiteDomainStatus.Pending }]
      }
    });

    (wrapper.vm as unknown as { onManageSite: (row: ISite) => void }).onManageSite(site);

    expect(open).toHaveBeenCalledWith('https://brand.studio.acedata.cloud/?dialog=settings', '_blank', 'noopener');
  });
});
