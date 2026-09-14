// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deliveryApi = vi.hoisted(() => ({ testPhone: vi.fn() }));
const updateDelivery = vi.hoisted(() => vi.fn());
const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('@/operators/siteAuthDelivery', () => ({ siteAuthDeliveryOperator: deliveryApi }));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: messages, ElMessageBox: { confirm: vi.fn() } };
});

import phoneDeliverySource from './SitePhoneDelivery.vue?raw';
import SitePhoneDelivery from './SitePhoneDelivery.vue';

const webhook = {
  url: 'https://sms.example.com/send',
  secret_configured: true,
  verified: false
};

const mountComponent = (deliveryConfig: any = { type: 'platform', webhook }) =>
  shallowMount(SitePhoneDelivery, {
    props: { siteId: 'site-1', providerEnabled: false, deliveryConfig, updateDelivery },
    global: { mocks: { $t: (key: string) => key, $i18n: { locale: 'zh-CN' } } }
  });

const sentDelivery = (call: unknown[]) => call[0] as any;

const switchValue = (wrapper: ReturnType<typeof mountComponent>) =>
  wrapper.findComponent({ name: 'ElSwitch' }).props('modelValue');

const formVisible = (wrapper: ReturnType<typeof mountComponent>) => wrapper.find('el-form-stub').exists();

const docsVisible = (wrapper: ReturnType<typeof mountComponent>) => wrapper.find('.phone-delivery__docs-link').exists();

describe('SitePhoneDelivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateDelivery.mockImplementation(async (delivery: any) => delivery);
  });

  it('keeps webhook documentation prose logical and examples left-to-right', () => {
    expect(phoneDeliverySource).toContain('class="phone-delivery__docs-dialog"');
    expect(phoneDeliverySource.match(/<pre dir="ltr">/g)).toHaveLength(3);
    expect(phoneDeliverySource).toMatch(/phone-delivery__docs-dialog \.el-dialog__header[\s\S]*text-align: start/);
    expect(phoneDeliverySource).toMatch(/\.phone-delivery__docs \{[\s\S]*text-align: start/);
    expect(phoneDeliverySource).toMatch(
      /\.phone-delivery__docs pre \{[\s\S]*direction: ltr;[\s\S]*text-align: left;[\s\S]*unicode-bidi: isolate/
    );
  });

  it('keeps platform delivery compact until custom setup is opened', async () => {
    const wrapper = mountComponent();
    await flushPromises();

    expect(switchValue(wrapper)).toBe(false);
    expect(formVisible(wrapper)).toBe(false);
    expect(docsVisible(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.secret).toBe('');

    await (wrapper.vm as any).toggleDelivery(true);
    await wrapper.vm.$nextTick();

    expect(updateDelivery).not.toHaveBeenCalled();
    expect(switchValue(wrapper)).toBe(true);
    expect(formVisible(wrapper)).toBe(true);
    expect(docsVisible(wrapper)).toBe(true);
    expect(messages.warning).toHaveBeenCalledWith('site.message.authDeliveryEnableHelp');
  });

  it('collapses local setup and its docs without sending a platform update', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    await (wrapper.vm as any).toggleDelivery(true);
    (wrapper.vm as any).docsVisible = true;
    (wrapper.vm as any).draft.url = 'https://sms.example.com/unsaved';

    await (wrapper.vm as any).toggleDelivery(false);
    await wrapper.vm.$nextTick();

    expect(updateDelivery).not.toHaveBeenCalled();
    expect(switchValue(wrapper)).toBe(false);
    expect(formVisible(wrapper)).toBe(false);
    expect(docsVisible(wrapper)).toBe(false);
    expect((wrapper.vm as any).docsVisible).toBe(false);
    expect((wrapper.vm as any).draft.url).toBe('https://sms.example.com/unsaved');
  });

  it('saves, tests only recipient fields, and automatically enables with proof', async () => {
    deliveryApi.testPhone.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent();
    await flushPromises();
    await (wrapper.vm as any).toggleDelivery(true);
    (wrapper.vm as any).draft.url = 'https://sms.example.com/updated';
    (wrapper.vm as any).draft.secret = 'new-secret';

    await (wrapper.vm as any).saveDraft();
    (wrapper.vm as any).testTarget = { receiver: '138', region: '86', locale: 'zh-CN' };
    await (wrapper.vm as any).testDelivery();

    expect(sentDelivery(updateDelivery.mock.calls[0])).toEqual({
      type: 'platform',
      webhook: expect.objectContaining({ url: 'https://sms.example.com/updated', secret: 'new-secret' })
    });
    expect(deliveryApi.testPhone).toHaveBeenCalledWith('site-1', { receiver: '138', region: '86', locale: 'zh-CN' });
    expect(sentDelivery(updateDelivery.mock.calls[1])).toMatchObject({
      type: 'webhook',
      webhook: { test_proof: 'proof-1' }
    });
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('does not reactivate when testing an already active webhook', async () => {
    deliveryApi.testPhone.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent({ type: 'webhook', webhook: { ...webhook, verified: true } });
    await flushPromises();
    (wrapper.vm as any).testTarget = { receiver: '138', region: '86', locale: 'zh-CN' };

    await (wrapper.vm as any).testDelivery();

    expect(deliveryApi.testPhone).toHaveBeenCalledTimes(1);
    expect(updateDelivery).not.toHaveBeenCalled();
  });

  it('directly enables an existing verified webhook', async () => {
    const wrapper = mountComponent({ type: 'platform', webhook: { ...webhook, verified: true } });
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);

    expect(updateDelivery).toHaveBeenCalledTimes(1);
    expect(sentDelivery(updateDelivery.mock.calls[0])).toMatchObject({ type: 'webhook' });
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('turns an active webhook off in one saved update and collapses its docs', async () => {
    const wrapper = mountComponent({ type: 'webhook', webhook: { ...webhook, verified: true } });
    await flushPromises();
    (wrapper.vm as any).docsVisible = true;

    await (wrapper.vm as any).toggleDelivery(false);
    await wrapper.vm.$nextTick();

    expect(updateDelivery).toHaveBeenCalledTimes(1);
    expect(sentDelivery(updateDelivery.mock.calls[0])).toEqual({
      type: 'platform',
      webhook: expect.objectContaining({ url: 'https://sms.example.com/send' })
    });
    expect(switchValue(wrapper)).toBe(false);
    expect(formVisible(wrapper)).toBe(false);
    expect((wrapper.vm as any).docsVisible).toBe(false);
  });

  it('turns an active webhook off without discarding unsaved form edits', async () => {
    const wrapper = mountComponent({ type: 'webhook', webhook: { ...webhook, verified: true } });
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/unsaved';

    await (wrapper.vm as any).toggleDelivery(false);

    expect(switchValue(wrapper)).toBe(false);
    expect((wrapper.vm as any).draft.url).toBe('https://sms.example.com/unsaved');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('keeps setup expanded while saving an edited active webhook and omits a blank secret', async () => {
    const wrapper = mountComponent({ type: 'webhook', webhook: { ...webhook, verified: true } });
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/new';

    await (wrapper.vm as any).saveDraft();

    expect(updateDelivery).toHaveBeenCalledTimes(2);
    expect(sentDelivery(updateDelivery.mock.calls[0])).toMatchObject({ type: 'platform' });
    expect(sentDelivery(updateDelivery.mock.calls[1])).toMatchObject({
      type: 'platform',
      webhook: { url: 'https://sms.example.com/new' }
    });
    expect(sentDelivery(updateDelivery.mock.calls[1]).webhook).not.toHaveProperty('secret');
    expect(sentDelivery(updateDelivery.mock.calls[0]).webhook).not.toHaveProperty('secret_configured');
    expect(sentDelivery(updateDelivery.mock.calls[0]).webhook).not.toHaveProperty('verified');
    expect(sentDelivery(updateDelivery.mock.calls[0]).webhook).not.toHaveProperty('verified_at');
    expect(sentDelivery(updateDelivery.mock.calls[0]).webhook).not.toHaveProperty('test_proof');
    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect(formVisible(wrapper)).toBe(true);
  });

  it('keeps an edited webhook expanded and retryable when its second save step fails', async () => {
    updateDelivery
      .mockResolvedValueOnce({ type: 'platform', webhook: { ...webhook, verified: true } })
      .mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent({ type: 'webhook', webhook: { ...webhook, verified: true } });
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/new';

    await (wrapper.vm as any).saveDraft();

    expect(updateDelivery).toHaveBeenCalledTimes(2);
    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect((wrapper.vm as any).draft.url).toBe('https://sms.example.com/new');
    expect((wrapper.vm as any).dirty).toBe(true);
  });

  it('does not save edited webhook data if the required platform switch fails', async () => {
    updateDelivery.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent({ type: 'webhook', webhook: { ...webhook, verified: true } });
    await flushPromises();
    (wrapper.vm as any).draft.url = 'https://sms.example.com/new';

    await (wrapper.vm as any).saveDraft();

    expect(updateDelivery).toHaveBeenCalledTimes(1);
    expect((wrapper.vm as any).active).toBe(true);
    expect(switchValue(wrapper)).toBe(true);
  });

  it('keeps verified setup visible but server-inactive when enabling fails', async () => {
    updateDelivery.mockRejectedValueOnce(new Error('failed'));
    const wrapper = mountComponent({ type: 'platform', webhook: { ...webhook, verified: true } });
    await flushPromises();

    await (wrapper.vm as any).toggleDelivery(true);
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).active).toBe(false);
    expect(switchValue(wrapper)).toBe(true);
    expect(formVisible(wrapper)).toBe(true);
    expect(messages.error).toHaveBeenCalledWith('site.error.authDeliveryChange');
  });
});
