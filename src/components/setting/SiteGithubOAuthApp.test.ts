// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const confirm = vi.hoisted(() => vi.fn());
vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return { ...actual, ElMessageBox: { confirm } };
});

import SiteGithubOAuthApp from './SiteGithubOAuthApp.vue';

const platform = { mode: 'platform' as const };
const custom = {
  mode: 'custom' as const,
  config: { client_id: 'saved-client' },
  secret_status: { client_secret: { configured: true } },
  callback: { path: '/oauth/callback/github' }
};

const mountComponent = (credentials: object = platform) =>
  shallowMount(SiteGithubOAuthApp, {
    props: { credentials, providerEnabled: true },
    global: { mocks: { $t: (key: string) => key } }
  });

describe('SiteGithubOAuthApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    confirm.mockResolvedValue(undefined);
  });

  it('applies custom credentials that arrive after mount', async () => {
    const wrapper = mountComponent();

    await wrapper.setProps({ credentials: custom });

    expect((wrapper.vm as any).mode).toBe('custom');
    expect((wrapper.vm as any).customVisible).toBe(true);
    expect((wrapper.vm as any).draft).toEqual({ clientId: 'saved-client', clientSecret: '' });
    expect((wrapper.vm as any).configured).toBe(true);
  });

  it('reuses a configured secret only while the client ID is unchanged', async () => {
    const wrapper = mountComponent(custom);

    expect((wrapper.vm as any).canSave).toBe(true);
    (wrapper.vm as any).draft.clientId = 'changed-client';
    expect((wrapper.vm as any).canSave).toBe(false);
    (wrapper.vm as any).draft.clientSecret = 'replacement-secret';
    expect((wrapper.vm as any).canSave).toBe(true);
  });

  it('omits a blank saved secret from the staged payload', () => {
    const wrapper = mountComponent(custom);

    (wrapper.vm as any).save();

    expect(wrapper.emitted('change')).toEqual([[{ mode: 'custom', config: { client_id: 'saved-client' } }]]);
  });

  it('includes a newly entered secret in the staged payload', async () => {
    const wrapper = mountComponent();
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
    expect((wrapper.vm as any).draft.clientSecret).toBe('new-secret');
  });

  it('confirms before staging platform mode', async () => {
    const wrapper = mountComponent(custom);

    await (wrapper.vm as any).toggleCustomApp(false);

    expect(confirm).toHaveBeenCalledOnce();
    expect(wrapper.emitted('change')).toEqual([[{ mode: 'platform' }]]);
    expect((wrapper.vm as any).mode).toBe('custom');
    expect((wrapper.vm as any).draft.clientId).toBe('saved-client');
  });
});
