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
    google: {
      enabled: true,
      credentials: {
        mode: 'custom' as const,
        config: { client_id: 'saved-google' },
        secret_status: { client_secret: { configured: true } },
        callback: { path: '/oauth/callback/google' }
      }
    },
    apple: {
      enabled: true,
      credentials: {
        mode: 'custom' as const,
        config: { client_id: 'com.example.web' },
        callback: { path: '/oauth/callback/apple' }
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
        SiteOAuthAppEditor: true,
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
    expect(wrapper.findComponent({ name: 'SiteOAuthAppEditor' }).exists()).toBe(false);
    await (wrapper.vm as any).saveOAuthCredentials('github', { mode: 'custom', config: { client_id: 'unsafe' } });
    expect(siteApi.update).not.toHaveBeenCalled();

    resolveDetail(response(managedAuth, 7));
    await flushPromises();
    expect((wrapper.vm as any).managementLoaded).toBe(true);
  });

  it('hydrates GitHub credentials from the management detail endpoint', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();

    expect(siteApi.get).toHaveBeenCalledWith('site-1');
    expect((wrapper.vm as any).oauthCredentials('github')).toMatchObject({
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
    await (wrapper.vm as any).saveOAuthCredentials('github', {
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
    expect((wrapper.vm as any).oauthCredentials('github').mode).toBe('custom');
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
    await (wrapper.vm as any).saveOAuthCredentials('github', {
      mode: 'custom',
      config: { client_id: 'saved-client' }
    });

    expect(store.dispatch).toHaveBeenCalledWith('getSite');
    expect((wrapper.vm as any).oauthCredentials('github').mode).toBe('custom');
    expect((wrapper.vm as any).oauthCredentials('github').secret_status.client_secret.configured).toBe(true);
  });

  it('preserves staged credentials when a conflicting save fails', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();
    const staged = { mode: 'custom' as const, config: { client_id: 'saved-client' } };
    siteApi.update.mockRejectedValueOnce({ response: { status: 409 } });

    await (wrapper.vm as any).saveOAuthCredentials('github', staged);

    expect((wrapper.vm as any).oauthCredentialDrafts.github).toEqual(staged);
    expect((wrapper.vm as any).dirty).toBe(true);
    expect(messages.error).toHaveBeenCalledWith('site.error.authGithubOAuthSave');
  });

  it('isolates sibling OAuth drafts and strips management projections from the saved provider', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();
    const appleDraft = { mode: 'custom' as const, config: { client_id: 'com.changed.web' } };
    (wrapper.vm as any).oauthCredentialDrafts = { apple: appleDraft };

    await (wrapper.vm as any).saveOAuthCredentials('google', {
      mode: 'custom',
      config: { client_id: 'saved-google' }
    });

    const payload = siteApi.update.mock.calls[0][1];
    expect(payload.auth.providers.google).toEqual({
      enabled: true,
      credentials: { mode: 'custom', config: { client_id: 'saved-google' } }
    });
    expect(payload.auth.providers.github).toEqual({ enabled: true });
    expect(payload.auth.providers.apple).toEqual({ enabled: true });
    expect(JSON.stringify(payload)).not.toContain('secret_status');
    expect(JSON.stringify(payload)).not.toContain('callback');
    expect((wrapper.vm as any).oauthCredentialDrafts.apple).toEqual(appleDraft);
    expect((wrapper.vm as any).oauthCredentialDrafts.google).toBeUndefined();
  });

  it('clears every provider draft when the Site changes', async () => {
    const { wrapper, store } = mountComponent();
    await flushPromises();
    (wrapper.vm as any).oauthCredentialDrafts = {
      google: { mode: 'custom', config: { client_id: 'draft-google' } },
      apple: { mode: 'custom', config: { client_id: 'draft-apple' } }
    };

    store.getters.site = { id: 'site-2', auth: publicAuth };
    await (wrapper.vm as any).$options.watch['site.id'].handler.call(wrapper.vm, 'site-2');

    expect((wrapper.vm as any).oauthCredentialDrafts).toEqual({});
  });

  it('serializes delivery updates and uses the revision returned by the previous save', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();
    let resolveEmail: (value: unknown) => void = () => undefined;
    siteApi.update.mockReturnValueOnce(new Promise((resolve) => (resolveEmail = resolve))).mockResolvedValueOnce(
      response(
        {
          ...managedAuth,
          providers: {
            ...managedAuth.providers,
            phone: { enabled: true, delivery: { type: 'platform', webhook: null } }
          }
        },
        9
      )
    );

    const emailSave = (wrapper.vm as any).updateEmailDelivery({ type: 'platform', smtp: null });
    const phoneSave = (wrapper.vm as any).updatePhoneDelivery({ type: 'platform', webhook: null });
    await Promise.resolve();

    expect(siteApi.update).toHaveBeenCalledTimes(1);
    expect(siteApi.update.mock.calls[0][2]).toBe(7);

    resolveEmail(
      response(
        {
          ...managedAuth,
          providers: {
            ...managedAuth.providers,
            email: { enabled: true, delivery: { type: 'platform', smtp: null } }
          }
        },
        8
      )
    );
    await emailSave;
    await phoneSave;

    expect(siteApi.update).toHaveBeenCalledTimes(2);
    expect(siteApi.update.mock.calls[1][2]).toBe(8);
    expect((wrapper.vm as any).configurationRevision).toBe(9);
  });

  it('continues the update queue after a failed save without advancing its revision', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();
    siteApi.update.mockRejectedValueOnce({ response: { status: 409 } }).mockResolvedValueOnce(
      response(
        {
          ...managedAuth,
          providers: {
            ...managedAuth.providers,
            phone: { enabled: true, delivery: { type: 'platform', webhook: null } }
          }
        },
        8
      )
    );

    const failed = (wrapper.vm as any).updateEmailDelivery({ type: 'platform', smtp: null });
    const retry = (wrapper.vm as any).updatePhoneDelivery({ type: 'platform', webhook: null });
    await expect(failed).rejects.toMatchObject({ response: { status: 409 } });
    await retry;

    expect(siteApi.update).toHaveBeenCalledTimes(2);
    expect(siteApi.update.mock.calls[0][2]).toBe(7);
    expect(siteApi.update.mock.calls[1][2]).toBe(7);
    expect((wrapper.vm as any).configurationRevision).toBe(8);
  });

  it('uses the revision advanced by delivery changes for the next auth save', async () => {
    const { wrapper } = mountComponent();
    await flushPromises();
    siteApi.update
      .mockResolvedValueOnce(
        response(
          {
            ...managedAuth,
            providers: {
              ...managedAuth.providers,
              email: { enabled: true, delivery: { type: 'platform', smtp: null } }
            }
          },
          8
        )
      )
      .mockResolvedValueOnce(response({ ...managedAuth, login_mode: 'redirect' }, 9));

    await (wrapper.vm as any).updateEmailDelivery({ type: 'platform', smtp: null });
    (wrapper.vm as any).onLoginModeChange('redirect');
    await (wrapper.vm as any).save();

    expect(siteApi.update.mock.calls[1][2]).toBe(8);
    expect(messages.success).toHaveBeenCalledWith('common.message.saved');
  });
});
