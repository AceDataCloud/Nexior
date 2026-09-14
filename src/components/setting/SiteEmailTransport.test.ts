// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deliveryApi = vi.hoisted(() => ({ testEmail: vi.fn() }));
const updateDelivery = vi.hoisted(() => vi.fn());
const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('@/operators/siteAuthDelivery', () => ({ siteAuthDeliveryOperator: deliveryApi }));
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

const mountComponent = (deliveryConfig: any = { type: 'platform', smtp }, providerEnabled = false) =>
  shallowMount(SiteEmailTransport, {
    props: { siteId: 'site-1', providerEnabled, deliveryConfig, updateDelivery },
    global: { mocks: { $t: (key: string) => key } }
  });

const sentDelivery = (call: unknown[]) => call[0] as any;

const switchValue = (wrapper: ReturnType<typeof mountComponent>) =>
  wrapper.findComponent({ name: 'ElSwitch' }).props('modelValue');

const formVisible = (wrapper: ReturnType<typeof mountComponent>) => wrapper.find('el-form-stub').exists();

describe('SiteEmailTransport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateDelivery.mockImplementation(async (delivery: any) => delivery);
  });

  it('keeps platform delivery compact until custom setup is opened', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(switchValue(wrapper)).toBe(false);
    expect(formVisible(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.password).toBe('');

    await (wrapper.vm as any).toggleDelivery(true);
    await wrapper.vm.$nextTick();

    expect(updateDelivery).not.toHaveBeenCalled();
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

    expect(updateDelivery).not.toHaveBeenCalled();
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
    expect(updateDelivery).toHaveBeenCalledTimes(1);
    expect(sentDelivery(updateDelivery.mock.calls[0])).toEqual({
      type: 'smtp',
      smtp: expect.objectContaining({ test_proof: 'proof-1' })
    });
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('does not reactivate when testing an already active config', async () => {
    deliveryApi.testEmail.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent({ type: 'smtp', smtp: { ...smtp, verified: true } });
    await flushPromises();

    await (wrapper.vm as any).testDelivery();

    expect(deliveryApi.testEmail).toHaveBeenCalledWith('site-1');
    expect(updateDelivery).not.toHaveBeenCalled();
  });

  it('directly enables an existing verified SMTP config', async () => {
    const wrapper = mountComponent({ type: 'platform', smtp: { ...smtp, verified: true } });
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);

    expect(updateDelivery).toHaveBeenCalledTimes(1);
    expect(sentDelivery(updateDelivery.mock.calls[0])).toMatchObject({ type: 'smtp' });
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('turns active SMTP off in one saved update and collapses without deleting config', async () => {
    const wrapper = mountComponent({ type: 'smtp', smtp: { ...smtp, verified: true } });
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(false);
    await wrapper.vm.$nextTick();

    expect(updateDelivery).toHaveBeenCalledTimes(1);
    expect(sentDelivery(updateDelivery.mock.calls[0])).toEqual({
      type: 'platform',
      smtp: expect.objectContaining({ host: 'smtp.example.com' })
    });
    expect(switchValue(wrapper)).toBe(false);
    expect(formVisible(wrapper)).toBe(false);
  });

  it('turns active SMTP off without discarding unsaved form edits', async () => {
    const wrapper = mountComponent({ type: 'smtp', smtp: { ...smtp, verified: true } });
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Unsaved';

    await (wrapper.vm as any).toggleDelivery(false);

    expect(switchValue(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.from_name).toBe('Unsaved');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('keeps setup expanded while saving an edited active draft and omits a blank password', async () => {
    const wrapper = mountComponent({ type: 'smtp', smtp: { ...smtp, verified: true } });
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(updateDelivery).toHaveBeenCalledTimes(2);
    expect(sentDelivery(updateDelivery.mock.calls[0])).toMatchObject({ type: 'platform' });
    expect(sentDelivery(updateDelivery.mock.calls[1])).toMatchObject({
      type: 'platform',
      smtp: { from_name: 'Updated' }
    });
    expect(sentDelivery(updateDelivery.mock.calls[1]).smtp).not.toHaveProperty('password');
    expect(sentDelivery(updateDelivery.mock.calls[0]).smtp).not.toHaveProperty('password_configured');
    expect(sentDelivery(updateDelivery.mock.calls[0]).smtp).not.toHaveProperty('verified');
    expect(sentDelivery(updateDelivery.mock.calls[0]).smtp).not.toHaveProperty('verified_at');
    expect(sentDelivery(updateDelivery.mock.calls[0]).smtp).not.toHaveProperty('test_proof');
    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect(formVisible(wrapper)).toBe(true);
  });

  it('keeps an edited draft expanded and retryable when its second save step fails', async () => {
    updateDelivery
      .mockResolvedValueOnce({ type: 'platform', smtp: { ...smtp, verified: true } })
      .mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent({ type: 'smtp', smtp: { ...smtp, verified: true } });
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(updateDelivery).toHaveBeenCalledTimes(2);
    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect((wrapper.vm as any).draft.from_name).toBe('Updated');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('stops before saving the draft when switching active SMTP to platform fails', async () => {
    updateDelivery.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent({ type: 'smtp', smtp: { ...smtp, verified: true } });
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(updateDelivery).toHaveBeenCalledTimes(1);
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('keeps verified setup visible but server-inactive when enabling fails', async () => {
    updateDelivery.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent({ type: 'platform', smtp: { ...smtp, verified: true } });
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect(formVisible(wrapper)).toBe(true);
    expect(messages.error).toHaveBeenCalledWith('site.error.authDeliveryChange');
  });
});
