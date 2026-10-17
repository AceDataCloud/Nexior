// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const installFromCatalog = vi.hoisted(() => vi.fn());
const prepareAuthorizeFlow = vi.hoisted(() => vi.fn());
const openAuthorizeFlow = vi.hoisted(() => vi.fn());
const showError = vi.hoisted(() => vi.fn());

vi.mock('@/operators/connection', async (original) => ({
  ...(await original<typeof import('@/operators/connection')>()),
  connectionOperator: { installFromCatalog }
}));
vi.mock('@/utils/connections/authorizeFlow', () => ({ prepareAuthorizeFlow, openAuthorizeFlow }));
vi.mock('element-plus', async (original) => ({
  ...(await original<typeof import('element-plus')>()),
  ElMessage: { error: showError }
}));

import ConnectorPage from './Index.vue';

const methods = (ConnectorPage as any).methods;
const method = {
  id: 'oauth',
  execution: { type: 'skill' },
  credential: { type: 'oauth2', provider_id: 'google' },
  permissions: []
};
const catalog = { id: 'catalog-id', identifier: 'google/blogger', installable: true, connection_methods: [method] };

describe('connector reconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prepareAuthorizeFlow.mockResolvedValue({ returnUrl: 'https://auth.example.com/connections/popup-return' });
  });

  it('pins the selected row through the install request and popup completion', async () => {
    const runAuthorizePopup = vi.fn();
    const context = {
      pendingReconnectId: 'selected-account',
      pendingCreateNew: false,
      connections: [{ id: 'selected-account', last_refreshed_at: 'before' }],
      runAuthorizePopup,
      clearCreateNewIntent: vi.fn()
    };
    installFromCatalog.mockResolvedValue({
      data: { type: 'redirect', authorization_url: 'https://accounts.example.com/oauth' }
    });

    await methods.startAuthorize.call(context, catalog, method, undefined);

    expect(installFromCatalog).toHaveBeenCalledWith('catalog-id', {
      scopes: undefined,
      return_url: 'https://auth.example.com/connections/popup-return',
      method_id: 'oauth',
      connection_id: 'selected-account'
    });
    expect(runAuthorizePopup).toHaveBeenCalledWith(
      'https://accounts.example.com/oauth',
      undefined,
      undefined,
      'selected-account',
      'before'
    );
  });

  it('keeps the selected row when the method picker closes after confirmation', async () => {
    const connectWithMethod = vi.fn();
    const clearCreateNewIntent = vi.fn();
    const context = {
      pendingReconnectId: 'selected-account',
      pendingCreateNew: false,
      pickerConfirmed: false,
      pickerVisible: true,
      connectWithMethod,
      clearCreateNewIntent
    };

    methods.onMethodSelected.call(context, { item: catalog, method });
    methods.onPickerVisibility.call(context, false);

    expect(connectWithMethod).toHaveBeenCalledWith(catalog, method);
    expect(context.pendingReconnectId).toBe('selected-account');
    expect(clearCreateNewIntent).not.toHaveBeenCalled();
  });

  it('reports a closed popup when the selected account was not updated', async () => {
    openAuthorizeFlow.mockResolvedValue(undefined);
    const context = {
      connections: [{ id: 'selected-account', status: 'active', last_refreshed_at: 'before' }],
      clearCreateNewIntent: vi.fn(),
      fetchConnections: vi.fn().mockResolvedValue(true),
      normalizedStatus: (status: string) => status,
      $t: (key: string) => key
    };

    await methods.runAuthorizePopup.call(
      context,
      'https://accounts.example.com/oauth',
      undefined,
      undefined,
      'selected-account',
      'before'
    );

    expect(showError).toHaveBeenCalledWith('connection.message.installFailed');
  });
});

describe('connector OAuth scope defaults', () => {
  it('starts the YouTube account picker with the server-declared read-only default', async () => {
    const permissions = [
      { id: 'openid' },
      { id: 'https://www.googleapis.com/auth/userinfo.email' },
      { id: 'https://www.googleapis.com/auth/youtube.upload' },
      { id: 'https://www.googleapis.com/auth/youtube.readonly' }
    ];
    const youtubeMethod = {
      ...method,
      credential: {
        ...method.credential,
        default_scopes: ['openid', permissions[1].id, permissions[3].id]
      },
      permissions
    };
    const context = {
      scopeDialogCatalog: null,
      scopeDialogMethod: null,
      selectedScopes: [],
      scopeDialogVisible: false
    };

    await methods.connectWithMethod.call(context, catalog, youtubeMethod);

    expect(context.selectedScopes).toEqual(youtubeMethod.credential.default_scopes);
    expect(context.selectedScopes).not.toContain(permissions[2].id);
    expect(context.scopeDialogVisible).toBe(true);
  });

  it('keeps the historical default for methods without default_scopes', async () => {
    const permissions = [{ id: 'openid' }, { id: 'scope.write' }];
    const context = {
      scopeDialogCatalog: null,
      scopeDialogMethod: null,
      selectedScopes: [],
      scopeDialogVisible: false
    };

    await methods.connectWithMethod.call(context, catalog, { ...method, permissions });

    expect(context.selectedScopes).toEqual(['openid', 'scope.write']);
  });
});
