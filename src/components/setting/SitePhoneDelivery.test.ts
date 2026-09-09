// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), remove: vi.fn(), testPhone: vi.fn() }));
const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('@/operators/siteAuthDelivery', () => ({ siteAuthDeliveryOperator: api }));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: messages, ElMessageBox: { confirm: vi.fn() } };
});

import SitePhoneDelivery from './SitePhoneDelivery.vue';

const webhook = {
  url: 'https://sms.example.com/send',
  secret_configured: true,
  verified: false,
  verification_source: 'legacy_migration' as const
};

const mountComponent = () =>
  shallowMount(SitePhoneDelivery, {
    props: { siteId: 'site-1', providerEnabled: false },
    global: { mocks: { $t: (key: string) => key, $i18n: { locale: 'zh-CN' } } }
  });

const switchValue = (wrapper: ReturnType<typeof mountComponent>) =>
  wrapper.findComponent({ name: 'ElSwitch' }).props('modelValue');

describe('SitePhoneDelivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { providers: { phone: { delivery: { type: 'platform', webhook } } } } });
    api.update.mockImplementation((_site: string, _provider: string, delivery: unknown) => ({ data: delivery }));
    api.remove.mockResolvedValue({});
  });

  it('always renders editable webhook settings while reflecting the server transport', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(switchValue(wrapper)).toBe(false);
    expect(wrapper.find('el-form-stub').exists()).toBe(true);
    expect((wrapper.vm as any).webhook.verification_source).toBe('legacy_migration');
    expect((wrapper.vm as any).draft.secret).toBe('');
    expect(wrapper.findAll('el-input-stub').every((input) => input.attributes('disabled') === undefined)).toBe(true);
  });

  it('does not enable an unsaved or unverified webhook', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);

    expect(api.update).not.toHaveBeenCalled();
    expect(switchValue(wrapper)).toBe(false);
    expect(messages.warning).toHaveBeenCalledWith('site.message.authDeliveryEnableHelp');
  });

  it('saves, tests only recipient fields, then enables with proof', async () => {
    api.testPhone.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/updated';
    (wrapper.vm as any).draft.secret = 'new-secret';

    await (wrapper.vm as any).saveDraft();
    (wrapper.vm as any).testTarget = { receiver: '138', region: '86', locale: 'zh-CN' };
    await (wrapper.vm as any).testDelivery();
    await (wrapper.vm as any).toggleDelivery(true);

    expect(api.update.mock.calls[0][2]).toEqual({
      type: 'platform',
      webhook: expect.objectContaining({ url: 'https://sms.example.com/updated', secret: 'new-secret' })
    });
    expect(api.testPhone).toHaveBeenCalledWith('site-1', { receiver: '138', region: '86', locale: 'zh-CN' });
    expect(api.update.mock.calls[1][2]).toMatchObject({
      type: 'webhook',
      webhook: { test_proof: 'proof-1' }
    });
    expect(switchValue(wrapper)).toBe(true);
  });

  it('turns an active webhook off in one saved update', async () => {
    api.get.mockResolvedValue({
      data: { providers: { phone: { delivery: { type: 'webhook', webhook: { ...webhook, verified: true } } } } }
    });
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(false);

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(api.update.mock.calls[0][2]).toEqual({
      type: 'platform',
      webhook: expect.objectContaining({ url: 'https://sms.example.com/send' })
    });
    expect(switchValue(wrapper)).toBe(false);
  });

  it('turns an active webhook off without discarding unsaved form edits', async () => {
    api.get.mockResolvedValue({
      data: { providers: { phone: { delivery: { type: 'webhook', webhook: { ...webhook, verified: true } } } } }
    });
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/unsaved';

    await (wrapper.vm as any).toggleDelivery(false);

    expect(switchValue(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.url).toBe('https://sms.example.com/unsaved');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('turns an active webhook off before saving its edited draft without echoing a blank secret', async () => {
    api.get.mockResolvedValue({
      data: { providers: { phone: { delivery: { type: 'webhook', webhook: { ...webhook, verified: true } } } } }
    });
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/new';

    await (wrapper.vm as any).saveDraft();

    expect(api.update).toHaveBeenCalledTimes(2);
    expect(api.update.mock.calls[0][2]).toMatchObject({ type: 'platform' });
    expect(api.update.mock.calls[1][2]).toMatchObject({
      type: 'platform',
      webhook: { url: 'https://sms.example.com/new' }
    });
    expect(api.update.mock.calls[1][2].webhook).not.toHaveProperty('secret');
    expect(switchValue(wrapper)).toBe(false);
  });

  it('keeps an edited webhook retryable when its second save step fails', async () => {
    api.get.mockResolvedValue({
      data: { providers: { phone: { delivery: { type: 'webhook', webhook: { ...webhook, verified: true } } } } }
    });
    api.update
      .mockResolvedValueOnce({ data: { type: 'platform', webhook: { ...webhook, verified: true } } })
      .mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/new';

    await (wrapper.vm as any).saveDraft();

    expect(api.update).toHaveBeenCalledTimes(2);
    expect(switchValue(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.url).toBe('https://sms.example.com/new');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('does not save edited webhook data if the required platform switch fails', async () => {
    api.get.mockResolvedValue({
      data: { providers: { phone: { delivery: { type: 'webhook', webhook: { ...webhook, verified: true } } } } }
    });
    api.update.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/new';

    await (wrapper.vm as any).saveDraft();

    expect(api.update).toHaveBeenCalledTimes(1);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('keeps the switch off when an enable request fails', async () => {
    api.get.mockResolvedValue({
      data: { providers: { phone: { delivery: { type: 'platform', webhook: { ...webhook, verified: true } } } } }
    });
    api.update.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent();
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);

    expect(switchValue(wrapper)).toBe(false);
    expect(messages.error).toHaveBeenCalledWith('site.error.authDeliveryChange');
  });
});
