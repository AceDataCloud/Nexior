// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const siteApi = vi.hoisted(() => ({ get: vi.fn(), update: vi.fn() }));
const messages = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() }));
vi.mock('@/operators', () => ({ siteOperator: siteApi }));
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessage: messages };
});

import Auth from './Auth.vue';

const publicAuth = {
  default_provider: 'github',
  login_mode: 'iframe' as const,
  providers: { github: { enabled: true } }
};
const managedAuth = {
  default_provider: 'github',
  login_mode: 'iframe' as const,
  providers: {
    github: {
      enabled: true,
      credentials: {
        mode: 'custom' as const,
        config: { client_id: 'saved-client' },
        secret_status: { client_secret: { configured: true } },
        callback: { path: '/oauth/callback/github' }
      }
    },
    email: { enabled: true, delivery: { type: 'platform' } }
  }
};

const response = (auth: object, configurationRevision: number) => ({
  data: { id: 'site-1', auth, configuration_revision: configurationRevision }
});

const mountComponent = () => {
  const store = {
    getters: { site: { id: 'site-1', auth: publicAuth } },
    dispatch: vi.fn(async () => {
      store.getters.site = { id: 'site-1', auth: publicAuth };
    })
  };
  const wrapper = shallowMount(Auth, {
    global: {
      mocks: { $store: store, $t: (key: string) => key },
      stubs: {
        SectionNotice: true,
        SiteEmailTransport: true,
        SiteGithubOAuthApp: true,
        SitePhoneDelivery: true
      }
    }
  });
  return { wrapper, store };
};

describe('Auth settings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    siteApi.get.mockResolvedValue(response(managedAuth, 7));
    siteApi.update.mockResolvedValue(response(managedAuth, 8));
  });

  it('does not expose or save management controls before detail loading completes', async () => {
    let resolveDetail: (value: unknown) => void = () => undefined;
    siteApi.get.mockReturnValueOnce(new Promise((resolve) => (resolveDetail = resolve)));
    const { wrapper } = mountComponent();

    expect((wrapper.vm as any).managementLoaded).toBe(false);
    expect(wrapper.findComponent({ name: 'SiteGithubOAuthApp' }).exists()).toBe(false);
    await (wrapper.vm as any).saveGithubCredentials({ mode: 'custom', config: { client_id: 'unsafe' } });
    expect(siteApi.update).not.toHaveBeenCalled();

    resolveDetail(response(managedAuth, 7));
    await flushPromises();
    expect((wrapper.vm as any).managementLoaded).toBe(true);
  });

  it('hydrates GitHub credentials from the management detail endpoint', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();

    expect(siteApi.get).toHaveBeenCalledWith('site-1');
    expect((wrapper.vm as any).githubCredentials).toMatchObject({
      mode: 'custom',
      config: { client_id: 'saved-client' },
      secret_status: { client_secret: { configured: true } }
    });
    expect((wrapper.vm as any).configurationRevision).toBe(7);
    expect((wrapper.vm as any).dirty).toBe(false);
  });

  it('saves staged credentials once with the detail revision and no blank secret', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();
    await (wrapper.vm as any).saveGithubCredentials({
      mode: 'custom',
      config: { client_id: 'saved-client' }
    });

    expect(siteApi.update).toHaveBeenCalledTimes(1);
    expect(siteApi.update).toHaveBeenCalledWith(
      'site-1',
      {
        auth: expect.objectContaining({
          providers: expect.objectContaining({
            github: {
              enabled: true,
              credentials: { mode: 'custom', config: { client_id: 'saved-client' } }
            }
          })
        })
      },
      7
    );
    expect(JSON.stringify(siteApi.update.mock.calls[0][1])).not.toContain('secret_status');
    expect(JSON.stringify(siteApi.update.mock.calls[0][1])).not.toContain('client_secret');
    expect((wrapper.vm as any).configurationRevision).toBe(8);
    expect((wrapper.vm as any).githubCredentials.mode).toBe('custom');
  });

  it('does not echo credential or delivery projections for ordinary auth edits', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();
    (wrapper.vm as any).onLoginModeChange('redirect');

    await (wrapper.vm as any).save();

    const payload = siteApi.update.mock.calls[0][1];
    expect(payload.auth.providers.github).toEqual({ enabled: true });
    expect(payload.auth.providers.email).toEqual({ enabled: true });
  });

  it('keeps the management response after the public store refresh', async () => {
    const { wrapper, store } = mountComponent();
    await flushPromises();
    await (wrapper.vm as any).saveGithubCredentials({
      mode: 'custom',
      config: { client_id: 'saved-client' }
    });

    expect(store.dispatch).toHaveBeenCalledWith('getSite');
    expect((wrapper.vm as any).githubCredentials.mode).toBe('custom');
    expect((wrapper.vm as any).githubCredentials.secret_status.client_secret.configured).toBe(true);
  });

  it('preserves staged credentials when a conflicting save fails', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();
    const staged = { mode: 'custom' as const, config: { client_id: 'saved-client' } };
    siteApi.update.mockRejectedValueOnce({ response: { status: 409 } });

    await (wrapper.vm as any).saveGithubCredentials(staged);

    expect((wrapper.vm as any).githubCredentialsDraft).toEqual(staged);
    expect((wrapper.vm as any).dirty).toBe(true);
    expect(messages.error).toHaveBeenCalledWith('site.error.save');
  });
});
