// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deliveryApi = vi.hoisted(() => ({ testEmail: vi.fn() }));
const siteApi = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));
const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('@/operators/siteAuthDelivery', () => ({ siteAuthDeliveryOperator: deliveryApi }));
vi.mock('@/operators/site', () => ({ siteOperator: siteApi }));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: messages, ElMessageBox: { confirm: vi.fn() } };
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

const siteResponse = (delivery: unknown, configurationRevision = 7) => ({
  data: { configuration_revision: configurationRevision, auth: { providers: { email: { delivery } } } }
});

const updateDelivery = (call: unknown[]) => (call[1] as any).auth.providers.email.delivery;

const mountComponent = (providerEnabled = false) =>
  shallowMount(SiteEmailTransport, {
    props: { siteId: 'site-1', providerEnabled },
    global: { mocks: { $t: (key: string) => key } }
  });

const switchValue = (wrapper: ReturnType<typeof mountComponent>) =>
  wrapper.findComponent({ name: 'ElSwitch' }).props('modelValue');

const formVisible = (wrapper: ReturnType<typeof mountComponent>) => wrapper.find('el-form-stub').exists();

describe('SiteEmailTransport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siteApi.get.mockResolvedValue(siteResponse({ type: 'platform', smtp }));
    siteApi.update.mockImplementation((_site: string, data: any) =>
      siteResponse(data.auth.providers.email.delivery, 8)
    );
  });

  it('keeps platform delivery compact until custom setup is opened', async () => {
    const wrapper = mountComponent(false);
    await flushPromises();

    expect(siteApi.get).toHaveBeenCalledWith('site-1');
    expect(switchValue(wrapper)).toBe(false);
    expect(formVisible(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.password).toBe('');

    await (wrapper.vm as any).toggleDelivery(true);
    await wrapper.vm.$nextTick();

    expect(siteApi.update).not.toHaveBeenCalled();
    expect(switchValue(wrapper)).toBe(true);
    expect(formVisible(wrapper)).toBe(true);
    expect(messages.warning).toHaveBeenCalledWith('site.message.authDeliveryEnableHelp');
  });

  it('collapses local setup without sending a platform update', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    await (wrapper.vm as any).toggleDelivery(true);
    (wrapper.vm as any).draft.from_name = 'Unsaved';

    await (wrapper.vm as any).toggleDelivery(false);
    await wrapper.vm.$nextTick();

    expect(siteApi.update).not.toHaveBeenCalled();
    expect(switchValue(wrapper)).toBe(false);
    expect(formVisible(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.from_name).toBe('Unsaved');
  });

  it('tests saved config and automatically enables it with proof', async () => {
    deliveryApi.testEmail.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent();
    await flushPromises();
    await (wrapper.vm as any).toggleDelivery(true);

    await (wrapper.vm as any).testDelivery();

    expect(deliveryApi.testEmail).toHaveBeenCalledWith('site-1');
    expect(siteApi.update).toHaveBeenCalledTimes(1);
    expect(siteApi.update).toHaveBeenCalledWith(
      'site-1',
      {
        auth: {
          providers: { email: { delivery: { type: 'smtp', smtp: expect.objectContaining({ test_proof: 'proof-1' }) } } }
        }
      },
      7
    );
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('does not reactivate when testing an already active config', async () => {
    siteApi.get.mockResolvedValue(siteResponse({ type: 'smtp', smtp: { ...smtp, verified: true } }));
    deliveryApi.testEmail.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).testDelivery();

    expect(deliveryApi.testEmail).toHaveBeenCalledWith('site-1');
    expect(siteApi.update).not.toHaveBeenCalled();
  });

  it('directly enables an existing verified SMTP config', async () => {
    siteApi.get.mockResolvedValue(siteResponse({ type: 'platform', smtp: { ...smtp, verified: true } }));
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);

    expect(siteApi.update).toHaveBeenCalledTimes(1);
    expect(updateDelivery(siteApi.update.mock.calls[0])).toMatchObject({ type: 'smtp' });
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('turns active SMTP off in one saved update and collapses without deleting config', async () => {
    siteApi.get.mockResolvedValue(siteResponse({ type: 'smtp', smtp: { ...smtp, verified: true } }));
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(false);
    await wrapper.vm.$nextTick();

    expect(siteApi.update).toHaveBeenCalledTimes(1);
    expect(siteApi.update).toHaveBeenCalledWith(
      'site-1',
      {
        auth: {
          providers: {
            email: { delivery: { type: 'platform', smtp: expect.objectContaining({ host: 'smtp.example.com' }) } }
          }
        }
      },
      7
    );
    expect(switchValue(wrapper)).toBe(false);
    expect(formVisible(wrapper)).toBe(false);
  });

  it('turns active SMTP off without discarding unsaved form edits', async () => {
    siteApi.get.mockResolvedValue(siteResponse({ type: 'smtp', smtp: { ...smtp, verified: true } }));
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Unsaved';

    await (wrapper.vm as any).toggleDelivery(false);

    expect(switchValue(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.from_name).toBe('Unsaved');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('keeps setup expanded while saving an edited active draft and omits a blank password', async () => {
    siteApi.get.mockResolvedValue(siteResponse({ type: 'smtp', smtp: { ...smtp, verified: true } }));
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(siteApi.update).toHaveBeenCalledTimes(2);
    expect(updateDelivery(siteApi.update.mock.calls[0])).toMatchObject({ type: 'platform' });
    expect(updateDelivery(siteApi.update.mock.calls[1])).toMatchObject({
      type: 'platform',
      smtp: { from_name: 'Updated' }
    });
    expect(updateDelivery(siteApi.update.mock.calls[1]).smtp).not.toHaveProperty('password');
    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect(formVisible(wrapper)).toBe(true);
  });

  it('keeps an edited draft expanded and retryable when its second save step fails', async () => {
    siteApi.get.mockResolvedValue(siteResponse({ type: 'smtp', smtp: { ...smtp, verified: true } }));
    siteApi.update
      .mockResolvedValueOnce(siteResponse({ type: 'platform', smtp: { ...smtp, verified: true } }, 8))
      .mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(siteApi.update).toHaveBeenCalledTimes(2);
    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect((wrapper.vm as any).draft.from_name).toBe('Updated');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('stops before saving the draft when switching active SMTP to platform fails', async () => {
    siteApi.get.mockResolvedValue(siteResponse({ type: 'smtp', smtp: { ...smtp, verified: true } }));
    siteApi.update.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(siteApi.update).toHaveBeenCalledTimes(1);
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('keeps verified setup visible but server-inactive when enabling fails', async () => {
    siteApi.get.mockResolvedValue(siteResponse({ type: 'platform', smtp: { ...smtp, verified: true } }));
    siteApi.update.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect(formVisible(wrapper)).toBe(true);
    expect(messages.error).toHaveBeenCalledWith('site.error.authDeliveryChange');
  });
});
