// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SITE_OAUTH_PROVIDERS } from '@/constants/siteOAuthProviders';
import type { ISiteOAuthCredentials } from '@/models';

const confirm = vi.hoisted(() => vi.fn());
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessageBox: { confirm } };
});

import SiteOAuthAppEditor from './SiteOAuthAppEditor.vue';

const platform = { mode: 'platform' as const };
const custom = {
  mode: 'custom' as const,
  config: { client_id: 'saved-client' },
  secret_status: { client_secret: { configured: true } },
  callback: { path: '/oauth/callback/github' }
};

const mountComponent = (
  provider: keyof typeof SITE_OAUTH_PROVIDERS = 'github',
  credentials: ISiteOAuthCredentials = platform
) =>
  shallowMount(SiteOAuthAppEditor, {
    props: { descriptor: SITE_OAUTH_PROVIDERS[provider], credentials, providerEnabled: true },
    global: { mocks: { $t: (key: string) => key } }
  });

describe('SiteOAuthAppEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirm.mockResolvedValue(undefined);
  });

  it('applies custom credentials that arrive after mount', async () => {
    const wrapper = mountComponent();
    await wrapper.setProps({ credentials: custom });
    expect((wrapper.vm as any).mode).toBe('custom');
    expect((wrapper.vm as any).draft).toEqual({ clientId: 'saved-client', clientSecret: '' });
    expect((wrapper.vm as any).configured).toBe(true);
  });

  it.each(['github', 'google'] as const)(
    '%s reuses a configured secret only while the client ID is unchanged',
    (provider) => {
      const wrapper = mountComponent(provider, custom);
      expect((wrapper.vm as any).canSave).toBe(true);
      (wrapper.vm as any).draft.clientId = 'changed-client';
      expect((wrapper.vm as any).canSave).toBe(false);
      (wrapper.vm as any).draft.clientSecret = 'replacement-secret';
      expect((wrapper.vm as any).canSave).toBe(true);
    }
  );

  it('omits a blank reusable secret from the staged payload', () => {
    const wrapper = mountComponent('google', custom);
    (wrapper.vm as any).save();
    expect(wrapper.emitted('change')).toEqual([[{ mode: 'custom', config: { client_id: 'saved-client' } }]]);
  });

  it('includes a newly entered confidential-client secret', async () => {
    const wrapper = mountComponent('google');
    await (wrapper.vm as any).toggleCustomApp(true);
    (wrapper.vm as any).draft = { clientId: 'new-client', clientSecret: 'new-secret' };
    (wrapper.vm as any).save();
    expect(wrapper.emitted('change')).toEqual([
      [
        {
          mode: 'custom',
          config: { client_id: 'new-client' },
          secret_values: { client_secret: 'new-secret' }
        }
      ]
    ]);
  });

  it('accepts an Apple Web Services ID without rendering or emitting a secret', async () => {
    const wrapper = mountComponent('apple');
    await (wrapper.vm as any).toggleCustomApp(true);
    (wrapper.vm as any).draft = { clientId: 'com.example.web', clientSecret: 'ignored' };
    expect((wrapper.vm as any).canSave).toBe(true);
    (wrapper.vm as any).save();
    expect(wrapper.text()).not.toContain('authAppleOAuthClientSecret');
    expect(wrapper.emitted('change')).toEqual([[{ mode: 'custom', config: { client_id: 'com.example.web' } }]]);
  });

  it('confirms before staging platform mode', async () => {
    const wrapper = mountComponent('github', custom);
    await (wrapper.vm as any).toggleCustomApp(false);
    expect(confirm).toHaveBeenCalledOnce();
    expect(wrapper.emitted('change')).toEqual([[{ mode: 'platform' }]]);
    expect((wrapper.vm as any).mode).toBe('custom');
  });

  it('preserves an unsaved draft when a sibling save returns unchanged credentials', async () => {
    const wrapper = mountComponent('google', custom);
    (wrapper.vm as any).draft = { clientId: 'edited-client', clientSecret: 'unsaved-secret' };
    await wrapper.setProps({ credentials: { ...custom } });
    expect((wrapper.vm as any).draft).toEqual({ clientId: 'edited-client', clientSecret: 'unsaved-secret' });
  });

  it('clears the secret only after the server confirms the staged credentials', async () => {
    const wrapper = mountComponent('google', custom);
    (wrapper.vm as any).draft = { clientId: 'edited-client', clientSecret: 'replacement-secret' };
    (wrapper.vm as any).save();
    await wrapper.setProps({ credentials: { ...custom, config: { client_id: 'edited-client' } } });
    expect((wrapper.vm as any).draft).toEqual({ clientId: 'edited-client', clientSecret: '' });
    expect((wrapper.vm as any).pendingSave).toBeUndefined();
  });
});
