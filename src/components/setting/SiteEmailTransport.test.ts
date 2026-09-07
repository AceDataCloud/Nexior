// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ test: vi.fn() }));

vi.mock('@/operators/siteEmailTransport', () => ({ siteEmailTransportOperator: api }));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: { success: vi.fn(), error: vi.fn() }, ElMessageBox: { confirm: vi.fn() } };
});

import type { ISiteAuth } from '@/models/site';
import SiteEmailTransport from './SiteEmailTransport.vue';

const smtp = {
  enabled: false,
  host: 'smtp.example.com',
  port: 587 as const,
  security: 'starttls' as const,
  username: 'mailer@example.com',
  password_configured: true,
  from_email: 'mailer@example.com',
  from_name: 'Tenant',
  reply_to: ''
};

const authWithSmtp = (value = smtp): ISiteAuth => ({
  providers: { email: { enabled: true, client_id: 'preserved-client', smtp: value } }
});

const mountComponent = (auth: ISiteAuth, saveAuth = vi.fn().mockResolvedValue(undefined)) =>
  shallowMount(SiteEmailTransport, {
    props: { siteId: 'site-1', auth, saveAuth },
    global: { mocks: { $t: (key: string) => key } }
  });

describe('SiteEmailTransport', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads Site.auth.providers.email.smtp without populating the write-only password', async () => {
    const wrapper = mountComponent(authWithSmtp());
    await flushPromises();

    expect((wrapper.vm as any).draft.password).toBe('');
    expect((wrapper.vm as any).smtp.password_configured).toBe(true);
  });

  it('saves under Site.auth.providers.email.smtp and preserves provider fields', async () => {
    const saveAuth = vi.fn().mockResolvedValue(undefined);
    const auth = authWithSmtp();
    const wrapper = mountComponent(auth, saveAuth);
    await flushPromises();

    (wrapper.vm as any).draft.from_name = 'Updated Tenant';
    await (wrapper.vm as any).save();

    const saved = saveAuth.mock.calls[0][0];
    expect(saved.providers.email.enabled).toBe(true);
    expect(saved.providers.email.client_id).toBe('preserved-client');
    expect(saved.providers.email.smtp.from_name).toBe('Updated Tenant');
    expect(saved.providers.email.smtp.enabled).toBe(false);
    expect(saved.providers.email.smtp).not.toHaveProperty('password');
    expect((wrapper.vm as any).draft.password).toBe('');
  });

  it('tests only saved config and derives fixed TLS ports', async () => {
    api.test.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    const wrapper = mountComponent(authWithSmtp());
    await flushPromises();

    await (wrapper.vm as any).testTransport();
    expect(api.test).toHaveBeenCalledWith('site-1');
    expect((wrapper.vm as any).testProof).toBe('proof-1');

    (wrapper.vm as any).onSecurityChange('implicit_tls');
    expect((wrapper.vm as any).draft.port).toBe(465);
    (wrapper.vm as any).onSecurityChange('starttls');
    expect((wrapper.vm as any).draft.port).toBe(587);
  });

  it('clears an old proof whenever configuration is saved', async () => {
    const saveAuth = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountComponent(authWithSmtp(), saveAuth);
    await flushPromises();
    (wrapper.vm as any).testProof = 'old-proof';
    (wrapper.vm as any).draft.host = 'changed.example.com';

    await (wrapper.vm as any).save();

    expect((wrapper.vm as any).testProof).toBe('');
    expect(saveAuth.mock.calls[0][0].providers.email.smtp.enabled).toBe(false);
  });

  it('requires a current test proof before enabling', async () => {
    const saveAuth = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountComponent(authWithSmtp(), saveAuth);
    await flushPromises();

    await (wrapper.vm as any).enable();
    expect(saveAuth).not.toHaveBeenCalled();

    api.test.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    await (wrapper.vm as any).testTransport();
    await (wrapper.vm as any).enable();

    const enabled = saveAuth.mock.calls[0][0].providers.email.smtp;
    expect(enabled.enabled).toBe(true);
    expect(enabled.test_proof).toBe('proof-1');
  });

  it('does not enable after the tested draft changes', async () => {
    const saveAuth = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountComponent(authWithSmtp(), saveAuth);
    await flushPromises();
    api.test.mockResolvedValue({ data: { success: true, test_proof: 'proof-1' } });
    await (wrapper.vm as any).testTransport();

    (wrapper.vm as any).draft.host = 'changed.example.com';
    await (wrapper.vm as any).enable();

    expect(saveAuth).not.toHaveBeenCalled();
  });

  it('deletes SMTP by saving an explicit null block', async () => {
    const saveAuth = vi.fn().mockResolvedValue(undefined);
    const wrapper = mountComponent(authWithSmtp(), saveAuth);
    await flushPromises();

    await (wrapper.vm as any).remove();

    expect(saveAuth.mock.calls[0][0].providers.email.smtp).toBeNull();
  });
});
