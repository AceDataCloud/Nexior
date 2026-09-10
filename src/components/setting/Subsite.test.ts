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

const telemetryMock = vi.hoisted(() => ({
  track: vi.fn()
}));

vi.mock('@/operators', () => ({
  siteOperator: siteOperatorMock,
  siteDomainOperator: siteDomainOperatorMock
}));

vi.mock('@/plugins/telemetry', () => telemetryMock);

import { ElMessageBox } from 'element-plus';
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

  it('separates API-confirmed creation from user-confirmed launch attempt', async () => {
    const created = { id: 'created-site', origin: 'returned.studio.acedata.cloud' };
    siteOperatorMock.create.mockResolvedValue({ data: created });
    let confirmLaunch!: (value: string) => void;
    const confirmation = new Promise<string>((resolve) => (confirmLaunch = resolve));
    const confirm = vi.spyOn(ElMessageBox, 'confirm').mockReturnValue(confirmation as any);
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = mountComponent();
    await flushPromises();
    await wrapper.setData({
      creating: {
        visible: true,
        submitting: false,
        form: { slug: 'requested', title: 'Requested Site' }
      }
    });

    await (wrapper.vm as any).onSubmitCreate();
    expect(telemetryMock.track).toHaveBeenCalledWith('subsite_create_success', {
      site_id: 'created-site',
      site_origin: 'returned.studio.acedata.cloud'
    });
    expect(open).not.toHaveBeenCalled();
    expect(telemetryMock.track).not.toHaveBeenCalledWith('subsite_launch_attempt', expect.anything());

    confirmLaunch('confirm');
    await flushPromises();
    expect(confirm).toHaveBeenCalled();
    expect(telemetryMock.track).toHaveBeenCalledWith('subsite_launch_attempt', {
      site_id: 'created-site',
      site_origin: 'returned.studio.acedata.cloud'
    });
    expect(open).toHaveBeenCalledWith('https://returned.studio.acedata.cloud/', '_blank', 'noopener');
    expect(telemetryMock.track).not.toHaveBeenCalledWith(expect.stringMatching(/launch_success/), expect.anything());
  });

  it('does not report creation or launch when the create request fails', async () => {
    siteOperatorMock.create.mockRejectedValue(new Error('create failed'));
    const confirm = vi.spyOn(ElMessageBox, 'confirm');
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = mountComponent();
    await flushPromises();
    await wrapper.setData({
      creating: {
        visible: true,
        submitting: false,
        form: { slug: 'failed', title: '' }
      }
    });

    await (wrapper.vm as any).onSubmitCreate();

    expect(telemetryMock.track).not.toHaveBeenCalledWith('subsite_create_success', expect.anything());
    expect(telemetryMock.track).not.toHaveBeenCalledWith('subsite_launch_attempt', expect.anything());
    expect(confirm).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it('does not report a launch attempt when the confirmation is dismissed', async () => {
    siteOperatorMock.create.mockResolvedValue({
      data: { id: 'created-site', origin: 'created.studio.acedata.cloud' }
    });
    vi.spyOn(ElMessageBox, 'confirm').mockRejectedValue(new Error('dismissed'));
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    const wrapper = mountComponent();
    await flushPromises();
    await wrapper.setData({
      creating: {
        visible: true,
        submitting: false,
        form: { slug: 'created', title: '' }
      }
    });

    await (wrapper.vm as any).onSubmitCreate();
    await flushPromises();

    expect(telemetryMock.track).toHaveBeenCalledWith('subsite_create_success', expect.anything());
    expect(telemetryMock.track).not.toHaveBeenCalledWith('subsite_launch_attempt', expect.anything());
    expect(open).not.toHaveBeenCalled();
  });
});
