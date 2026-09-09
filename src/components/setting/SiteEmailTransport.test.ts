// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), remove: vi.fn(), testEmail: vi.fn() }));
const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('@/operators/siteAuthDelivery', () => ({ siteAuthDeliveryOperator: api }));
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

const mountComponent = (providerEnabled = false) =>
  shallowMount(SiteEmailTransport, {
    props: { siteId: 'site-1', providerEnabled },
    global: { mocks: { $t: (key: string) => key } }
  });

const switchValue = (wrapper: ReturnType<typeof mountComponent>) =>
  wrapper.findComponent({ name: 'ElSwitch' }).props('modelValue');

describe('SiteEmailTransport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { providers: { email: { delivery: { type: 'platform', smtp } } } } });
    api.update.mockImplementation((_site: string, _provider: string, delivery: unknown) => ({ data: delivery }));
    api.remove.mockResolvedValue({});
  });

  it('renders editable custom settings while the server transport remains platform', async () => {
    const wrapper = mountComponent(false);
    await flushPromises();

    expect(api.get).toHaveBeenCalledWith('site-1');
    expect(switchValue(wrapper)).toBe(false);
    expect(wrapper.find('el-form-stub').exists()).toBe(true);
    expect((wrapper.vm as any).draft.password).toBe('');
    expect(wrapper.findAll('el-input-stub').every((input) => input.attributes('disabled') === undefined)).toBe(true);
  });

  it('does not enable an unsaved or unverified SMTP config', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);

    expect(api.update).not.toHaveBeenCalled();
    expect(switchValue(wrapper)).toBe(false);
    expect(messages.warning).toHaveBeenCalledWith('site.message.authDeliveryEnableHelp');
  });

  it('tests saved config then enables it with proof', async () => {
    api.testEmail.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).testDelivery();
    await (wrapper.vm as any).toggleDelivery(true);

    expect(api.testEmail).toHaveBeenCalledWith('site-1');
    expect(api.update).toHaveBeenCalledWith('site-1', 'email', {
      type: 'smtp',
      smtp: expect.objectContaining({ test_proof: 'proof-1' })
    });
    expect(switchValue(wrapper)).toBe(true);
  });

  it('turns active SMTP off in one saved update without deleting config', async () => {
    api.get.mockResolvedValue({
      data: { providers: { email: { delivery: { type: 'smtp', smtp: { ...smtp, verified: true } } } } }
    });
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(false);

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(api.update).toHaveBeenCalledWith('site-1', 'email', {
      type: 'platform',
      smtp: expect.objectContaining({ host: 'smtp.example.com' })
    });
    expect(switchValue(wrapper)).toBe(false);
  });

  it('turns active SMTP off without discarding unsaved form edits', async () => {
    api.get.mockResolvedValue({
      data: { providers: { email: { delivery: { type: 'smtp', smtp: { ...smtp, verified: true } } } } }
    });
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Unsaved';

    await (wrapper.vm as any).toggleDelivery(false);

    expect(switchValue(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.from_name).toBe('Unsaved');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('turns active SMTP off before saving an edited draft and omits a blank password', async () => {
    api.get.mockResolvedValue({
      data: { providers: { email: { delivery: { type: 'smtp', smtp: { ...smtp, verified: true } } } } }
    });
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(api.update).toHaveBeenCalledTimes(2);
    expect(api.update.mock.calls[0][2]).toMatchObject({ type: 'platform' });
    expect(api.update.mock.calls[1][2]).toMatchObject({ type: 'platform', smtp: { from_name: 'Updated' } });
    expect(api.update.mock.calls[1][2].smtp).not.toHaveProperty('password');
    expect(switchValue(wrapper)).toBe(false);
  });

  it('keeps an edited draft retryable when its second save step fails', async () => {
    api.get.mockResolvedValue({
      data: { providers: { email: { delivery: { type: 'smtp', smtp: { ...smtp, verified: true } } } } }
    });
    api.update
      .mockResolvedValueOnce({ data: { type: 'platform', smtp: { ...smtp, verified: true } } })
      .mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(api.update).toHaveBeenCalledTimes(2);
    expect(switchValue(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.from_name).toBe('Updated');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('stops before saving the draft when switching active SMTP to platform fails', async () => {
    api.get.mockResolvedValue({
      data: { providers: { email: { delivery: { type: 'smtp', smtp: { ...smtp, verified: true } } } } }
    });
    api.update.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.from_name = 'Updated';

    await (wrapper.vm as any).saveDraft();

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('keeps the server-backed switch state when enabling fails', async () => {
    api.get.mockResolvedValue({
      data: { providers: { email: { delivery: { type: 'platform', smtp: { ...smtp, verified: true } } } } }
    });
    api.update.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);

    expect(switchValue(wrapper)).toBe(false);
    expect(messages.error).toHaveBeenCalledWith('site.error.authDeliveryChange');
  });
});
