// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), remove: vi.fn(), testEmail: vi.fn() }));
vi.mock('@/operators/siteAuthDelivery', () => ({ siteAuthDeliveryOperator: api }));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: { success: vi.fn(), error: vi.fn() }, ElMessageBox: { confirm: vi.fn() } };
});

import SiteEmailTransport from './SiteEmailTransport.vue';

const smtp = {
  host: 'smtp.example.com',
  port: 587 as const,
  security: 'starttls' as const,
  username: 'mailer@example.com',
  password_configured: true,
  verified: false,
  from_email: 'mailer@example.com',
  from_name: 'Tenant',
  reply_to: ''
};

const mountComponent = (providerEnabled = false) =>
  shallowMount(SiteEmailTransport, {
    props: { siteId: 'site-1', providerEnabled },
    global: { mocks: { $t: (key: string) => key } }
  });

describe('SiteEmailTransport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { providers: { email: { delivery: { type: 'platform', smtp } } } } });
    api.update.mockImplementation((_site: string, _provider: string, delivery: unknown) => ({ data: delivery }));
    api.remove.mockResolvedValue({});
  });

  it('loads owner configuration and remains manageable when provider is disabled', async () => {
    const wrapper = mountComponent(false);
    await flushPromises();
    expect(api.get).toHaveBeenCalledWith('site-1');
    expect((wrapper.vm as any).smtp.host).toBe('smtp.example.com');
    expect((wrapper.vm as any).draft.password).toBe('');
    expect((wrapper.vm as any).providerEnabled).toBe(false);
    expect((wrapper.vm as any).viewMode).toBe('platform');
  });

  it('opens custom settings without changing the active transport', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.find('el-form-stub').exists()).toBe(false);

    wrapper.findComponent({ name: 'ElRadioGroup' }).vm.$emit('update:modelValue', 'smtp');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('el-form-stub').exists()).toBe(true);
    expect(api.update).not.toHaveBeenCalled();
  });

  it('saves a platform draft without echoing blank password', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).viewMode = 'smtp';
    (wrapper.vm as any).draft.from_name = 'Updated';
    await (wrapper.vm as any).saveDraft();
    const delivery = api.update.mock.calls[0][2];
    expect(delivery.type).toBe('platform');
    expect(delivery.smtp.from_name).toBe('Updated');
    expect(delivery.smtp).not.toHaveProperty('password');
  });

  it('tests saved config and activates only with proof', async () => {
    api.testEmail.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).viewMode = 'smtp';
    await (wrapper.vm as any).testDelivery();
    await (wrapper.vm as any).activate();
    expect(api.testEmail).toHaveBeenCalledWith('site-1');
    expect(api.update.mock.calls[0][2]).toMatchObject({
      type: 'smtp',
      smtp: { test_proof: 'proof-1' }
    });
  });

  it('switches active SMTP to platform without deleting config', async () => {
    api.get.mockResolvedValue({
      data: { providers: { email: { delivery: { type: 'smtp', smtp: { ...smtp, verified: true } } } } }
    });
    const wrapper = mountComponent();
    await flushPromises();
    await (wrapper.vm as any).switchToPlatform();
    expect((wrapper.vm as any).viewMode).toBe('smtp');
    expect(api.update.mock.calls[0][2]).toEqual({
      type: 'platform',
      smtp: expect.objectContaining({ host: 'smtp.example.com' })
    });
  });
});
