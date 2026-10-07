// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { popupReturnUrl } from '@/utils/connections/authorizePopup';

const api = vi.hoisted(() => ({ installFromCatalog: vi.fn(), authorizeCustom: vi.fn() }));
const browser = vi.hoisted(() => ({ open: vi.fn(), addListener: vi.fn() }));
vi.mock('@capacitor/browser', () => ({ Browser: browser }));
vi.mock('@/utils/authHandoff', () => ({
  isAuthFrontendUrl: () => false,
  prepareConnectorAuthorizationUrl: async (url: string) => url
}));
vi.mock('@/operators/connection', async (original) => ({
  ...(await original<typeof import('@/operators/connection')>()),
  connectionOperator: api
}));
import Manager from '@/pages/console/connectors/Index.vue';
import Directory from './BrowseConnectors.vue';

const item = { id: 'catalog', name: 'Test connector', identifier: 'test/connector', installable: true };
const oauth = { id: 'oauth', execution: { type: 'remote_mcp' }, credential: { type: 'oauth2' } };

// Exercise the real component methods and real authorization transport while
// replacing only network/Capacitor boundaries. Both entry points must refresh.
function manager() {
  const vm: any = {
    $t: (key: string) => key,
    pendingCreateNew: false,
    pendingReconnectId: null,
    authorizing: false,
    customAuthorizing: false,
    connections: [],
    fetchConnections: vi.fn().mockResolvedValue(true),
    customName: 'My MCP',
    customServerUrl: 'https://mcp.example.com',
    customDialogVisible: true
  };
  for (const name of [
    'startAuthorize',
    'runAuthorizePopup',
    'connectWithMethod',
    'onConnectCustom',
    'clearCreateNewIntent'
  ]) {
    vm[name] = (Manager as any).methods[name].bind(vm);
  }
  return vm;
}
function directory() {
  const vm: any = { $t: (key: string) => key, $emit: vi.fn(), fetchItems: vi.fn(), markInstalled: vi.fn() };
  vm.installWithMethod = (Directory as any).methods.installWithMethod.bind(vm);
  return vm;
}

describe.each(['ios', 'android'])('%s connector installation', (surface) => {
  let finish: () => void;
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SURFACE', surface);
    browser.open.mockResolvedValue(undefined);
    browser.addListener.mockImplementation((_event, cb) => {
      finish = cb;
      return Promise.resolve({ remove: vi.fn().mockResolvedValue(undefined) });
    });
  });
  afterEach(() => vi.unstubAllEnvs());

  it.each(['static', 'dcr'])('completes %s OAuth from the manager and refetches', async (kind) => {
    api.installFromCatalog.mockResolvedValue({
      data: { type: 'redirect', authorization_url: `https://${kind}.example.com/authorize` }
    });
    const vm = manager();
    vm.pendingCreateNew = true;
    const pending = vm.startAuthorize(item, oauth, ['read']);
    await vi.waitFor(() => expect(browser.open).toHaveBeenCalled());
    expect(vm.fetchConnections).not.toHaveBeenCalled();
    expect(api.installFromCatalog).toHaveBeenCalledWith('catalog', {
      method_id: 'oauth',
      return_url: popupReturnUrl(),
      scopes: ['read'],
      create_new: true
    });
    finish();
    await pending;
    expect(vm.fetchConnections).toHaveBeenCalledOnce();
    expect(vm.pendingCreateNew).toBe(false);
  });
  it('refreshes the directory and manager after catalog OAuth closes', async () => {
    api.installFromCatalog.mockResolvedValue({
      data: { type: 'redirect', authorization_url: 'https://oauth.example.com' }
    });
    const vm = directory();
    const pending = vm.installWithMethod(item, oauth);
    await vi.waitFor(() => expect(browser.open).toHaveBeenCalled());
    finish();
    await pending;
    expect(vm.$emit).toHaveBeenCalledWith('installed');
    expect(vm.fetchItems).toHaveBeenCalledOnce();
    expect(vm.installingId).toBeNull();
  });
  it('clears directory loading without reporting installation when opening fails', async () => {
    api.installFromCatalog.mockResolvedValue({
      data: { type: 'redirect', authorization_url: 'https://oauth.example.com' }
    });
    browser.open.mockRejectedValue(new Error('no browser'));
    const vm = directory();
    await vm.installWithMethod(item, oauth);
    expect(vm.$emit).not.toHaveBeenCalled();
    expect(vm.installingId).toBeNull();
  });
  it('connects a custom MCP through the native browser and refetches', async () => {
    api.authorizeCustom.mockResolvedValue({ data: { authorization_url: 'https://custom.example.com/authorize' } });
    const vm = manager();
    const pending = vm.onConnectCustom();
    await vi.waitFor(() => expect(browser.open).toHaveBeenCalled());
    expect(api.authorizeCustom).toHaveBeenCalledWith(
      expect.objectContaining({ server_url: 'https://mcp.example.com', return_url: popupReturnUrl(), provider: 'mcp' })
    );
    finish();
    await pending;
    expect(vm.fetchConnections).toHaveBeenCalledOnce();
    expect(vm.customAuthorizing).toBe(false);
  });
  it('installs public connectors without opening a browser', async () => {
    api.installFromCatalog.mockResolvedValue({ data: { type: 'active', connection_id: 'public' } });
    const publicMethod = { ...oauth, id: 'public', credential: { type: 'none' } };
    const vm = directory();
    await vm.installWithMethod(item, publicMethod);
    expect(vm.markInstalled).toHaveBeenCalledWith('catalog');
    expect(vm.$emit).toHaveBeenCalledWith('installed', { item, connection_id: 'public' });
    expect(browser.open).not.toHaveBeenCalled();
  });
  it.each(['user_secret', 'cookie_jar'])('routes %s to its credential form in both entry points', async (type) => {
    const method = { ...oauth, credential: { type } };
    const page = manager();
    const browse = directory();
    await page.connectWithMethod(item, method);
    await browse.installWithMethod(item, method);
    expect(page.byocDialogMethod).toEqual(method);
    expect(page.byocDialogVisible).toBe(true);
    expect(browse.byocDialogMethod).toEqual(method);
    expect(browse.byocDialogVisible).toBe(true);
    expect(api.installFromCatalog).not.toHaveBeenCalled();
  });
  it('allows choosing an already-paired computer for browser-device methods', async () => {
    const method = { ...oauth, execution: { type: 'browser_device' } };
    const page = manager();
    const browse = directory();
    await page.connectWithMethod(item, method);
    await browse.installWithMethod(item, method);
    expect(page.browserDevicePickerVisible).toBe(true);
    expect(browse.browserDevicePickerVisible).toBe(true);
    expect(api.installFromCatalog).not.toHaveBeenCalled();
  });
});

describe('mobile OAuth return page', () => {
  it('selects only a connection returned by the server, without starting another install', async () => {
    const vm: any = {
      $route: { query: { status: 'success', connection_id: 'new' } },
      fetchConnections: vi.fn(),
      fetchCatalog: vi.fn(),
      orderedItems: [
        { key: 'old', connection: { id: 'old' } },
        { key: 'new', connection: { id: 'new' } }
      ],
      items: [],
      selectedKey: 'old',
      onConnect: vi.fn()
    };
    await (Manager as any).mounted.call(vm);
    expect(vm.selectedKey).toBe('new');
    expect(vm.fetchConnections).toHaveBeenCalledOnce();
    expect(vm.onConnect).not.toHaveBeenCalled();
    vm.$route.query.connection_id = 'untrusted';
    vm.selectedKey = 'old';
    await (Manager as any).mounted.call(vm);
    expect(vm.selectedKey).toBe('old');
  });
});
