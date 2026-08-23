// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const surface = vi.hoisted(() => ({ isDesktop: vi.fn(() => false) }));
const bridge = vi.hoisted(() => ({ desktopBridge: vi.fn() }));
const urls = vi.hoisted(() => ({ getBaseUrlHub: vi.fn(() => 'https://studio.acedata.cloud') }));

vi.mock('@/utils/surface', () => surface);
vi.mock('@/utils/desktop', () => bridge);
vi.mock('@/utils/baseUrl', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/baseUrl')>()),
  getBaseUrlHub: urls.getBaseUrlHub
}));

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

function mountDialog() {
  return shallowMount(ByocCredentialsDialog, {
    props: { modelValue: true, item, method },
    global: {
      stubs: {
        ElDialog: { template: '<section><slot /><slot name="footer" /></section>' },
        ElButton: { template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>' },
        WarningIcon: true,
        SecurityIcon: true
      },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('ByocCredentialsDialog desktop cookie handoff', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    surface.isDesktop.mockReturnValue(false);
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
