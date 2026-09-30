// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const surface = vi.hoisted(() => ({ isDesktop: vi.fn(() => false) }));
const list = vi.hoisted(() => vi.fn());
const submit = vi.hoisted(() => vi.fn());
vi.mock('@/operators/connection', async (original) => ({
  ...(await original<typeof import('@/operators/connection')>()),
  connectionOperator: { list, submitCatalogCredentials: submit }
}));
const bridge = vi.hoisted(() => ({ desktopBridge: vi.fn() }));

vi.mock('@/utils/surface', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/surface')>()),
  isDesktop: surface.isDesktop
}));
vi.mock('@/utils/desktop', () => bridge);

import type { IConnectorCatalogItem, IConnectorConnectionMethod } from '@/operators/connection';
import ByocCredentialsDialog from './ByocCredentialsDialog.vue';

const item = {
  id: 'catalog-id',
  identifier: 'weibo/weibo',
  name: '微博',
  connection_methods: []
} as unknown as IConnectorCatalogItem;
const method = {
  id: 'cookie',
  execution: { type: 'skill' },
  credential: {
    type: 'cookie_jar',
    source: 'extension',
    cookie_domains: ['.weibo.com'],
    login_url: 'https://weibo.com/login.php',
    credential_schema: [{ key: 'cookies', type: 'cookies', required: true }]
  }
} as IConnectorConnectionMethod;

function mountDialog(overrideMethod = method) {
  return shallowMount(ByocCredentialsDialog, {
    props: { modelValue: true, item, method: overrideMethod },
    global: {
      stubs: {
        ElDialog: { template: '<section><slot /><slot name="footer" /></section>' },
        ElButton: { emits: ['click'], template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
        WarningIcon: true,
        SecurityIcon: true,
        ElForm: { template: '<form><slot /></form>', methods: { validate: async () => true } }
      },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('ByocCredentialsDialog connection surfaces', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.clearAllMocks();
    surface.isDesktop.mockReturnValue(false);
    vi.stubEnv('VITE_SURFACE', 'web');
  });

  it('opens the matching Studio connector in the system browser', async () => {
    surface.isDesktop.mockReturnValue(true);
    const openExternal = vi.fn().mockResolvedValue(undefined);
    bridge.desktopBridge.mockReturnValue({ openExternal });
    const wrapper = mountDialog();

    expect(wrapper.text()).toContain('connection.byoc.desktopBrowserTitle');
    expect(wrapper.text()).not.toContain('connection.byoc.extensionRecheck');

    await wrapper.get('.byoc-browser-open').trigger('click');

    expect(openExternal).toHaveBeenCalledWith('https://studio.acedata.cloud/console/connectors?connect=weibo%2Fweibo');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual([false]);
  });

  it('keeps the browser extension flow on web', () => {
    const wrapper = mountDialog();

    expect(wrapper.text()).toContain('connection.byoc.extensionMissingTitle');
    expect(wrapper.text()).toContain('connection.byoc.extensionRecheck');
    expect(wrapper.text()).not.toContain('connection.byoc.desktopBrowserTitle');
  });
});

// Native browsers cannot host the extension; the connection is shared through
// the account after completing setup on a computer.
describe('mobile credentials', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.clearAllMocks();
    surface.isDesktop.mockReturnValue(false);
  });
  it.each(['ios', 'android'])('shows actionable cookie setup on %s without extension polling', async (surfaceName) => {
    vi.stubEnv('VITE_SURFACE', surfaceName);
    const wrapper = mountDialog();
    expect(wrapper.text()).toContain('connection.byoc.mobileDesktopBody');
    expect(wrapper.text()).not.toContain('connection.byoc.extensionRecheck');
    expect(wrapper.text()).not.toContain('connection.byoc.extensionCapture');
    list.mockResolvedValue({
      data: [{ id: 'connected', connector_identifier: item.identifier, method_id: method.id, status: 'active' }]
    });
    await wrapper.get('.byoc-mobile-refresh').trigger('click');
    await vi.waitFor(() => expect(wrapper.emitted('installed')).toEqual([[{ item, connection_id: 'connected' }]]));
  });
  it('does not claim success for a missing, expired, or different-method connection', async () => {
    vi.stubEnv('VITE_SURFACE', 'ios');
    const wrapper = mountDialog();
    list.mockResolvedValue({
      data: [
        { id: 'expired', connector_identifier: item.identifier, method_id: method.id, status: 'expired' },
        { id: 'different', connector_identifier: item.identifier, method_id: 'oauth', status: 'active' }
      ]
    });
    await (wrapper.vm as any).refreshMobileConnection();
    expect(wrapper.emitted('installed')).toBeUndefined();
    expect((wrapper.vm as any).visible).toBe(true);
    expect((wrapper.vm as any).submitting).toBe(false);
  });
  it.each(['ios', 'android'])(
    'submits API keys with the chosen method and account intent on %s',
    async (surfaceName) => {
      vi.stubEnv('VITE_SURFACE', surfaceName);
      const keyMethod = {
        ...method,
        id: 'api-key',
        credential: { type: 'user_secret', credential_schema: [{ key: 'api_key', type: 'password', required: true }] }
      } as IConnectorConnectionMethod;
      const wrapper = mountDialog(keyMethod);
      await wrapper.setProps({ createNew: true });
      await wrapper.setData({ formModel: { api_key: ' test-key ' } });
      submit.mockResolvedValue({ data: { type: 'active', connection_id: 'key-connection' } });
      await (wrapper.vm as any).onSubmit();
      expect(submit).toHaveBeenCalledWith('catalog-id', {
        payload: { api_key: 'test-key' },
        method_id: 'api-key',
        create_new: true
      });
      expect(wrapper.emitted('installed')).toEqual([[{ item, connection_id: 'key-connection' }]]);
      expect((wrapper.vm as any).formModel).toEqual({});
    }
  );
});
