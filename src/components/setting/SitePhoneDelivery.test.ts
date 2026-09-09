// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn(), remove: vi.fn(), testPhone: vi.fn() }));
vi.mock('@/operators/siteAuthDelivery', () => ({ siteAuthDeliveryOperator: api }));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: { success: vi.fn() }, ElMessageBox: { confirm: vi.fn() } };
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

describe('SitePhoneDelivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: { providers: { phone: { delivery: { type: 'platform', webhook } } } } });
    api.update.mockImplementation((_site: string, _provider: string, delivery: unknown) => ({ data: delivery }));
  });

  it('loads migrated saved webhook without exposing its secret', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect((wrapper.vm as any).webhook.verification_source).toBe('legacy_migration');
    expect((wrapper.vm as any).draft.secret).toBe('');
    expect((wrapper.vm as any).viewMode).toBe('platform');
  });

  it('opens custom settings without changing the active transport', async () => {
    const wrapper = mountComponent();
    await flushPromises();
    expect(wrapper.find('el-form-stub').exists()).toBe(false);

    wrapper.findComponent({ name: 'ElRadioGroup' }).vm.$emit('update:modelValue', 'webhook');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('el-form-stub').exists()).toBe(true);
    expect(api.update).not.toHaveBeenCalled();
  });

  it('saves the webhook draft then tests only recipient fields', async () => {
    api.testPhone.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent();
    await flushPromises();
    (wrapper.vm as any).viewMode = 'webhook';
    (wrapper.vm as any).draft.url = 'https://sms.example.com/updated';
    (wrapper.vm as any).draft.secret = 'new-secret';
    await (wrapper.vm as any).saveDraft();
    expect(api.update.mock.calls[0][2]).toEqual({
      type: 'platform',
      webhook: expect.objectContaining({ url: 'https://sms.example.com/updated', secret: 'new-secret' })
    });

    (wrapper.vm as any).testTarget = { receiver: '138', region: '86', locale: 'zh-CN' };
    await (wrapper.vm as any).testDelivery();
    expect(api.testPhone).toHaveBeenCalledWith('site-1', { receiver: '138', region: '86', locale: 'zh-CN' });
  });
});
