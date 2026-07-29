import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import { getBaseUrlAuth } from '@/utils';
import type { IBrowserDevice } from '@/models/browserDevice';

/**
 * Connections and the connector catalog live in AuthBackend, not
 * PlatformBackend. Nexior's access_token already IS an AuthBackend JWT
 * (minted by `POST /sso/v1/token`), so we reuse the shared `httpClient` —
 * which injects the bearer, fingerprint, x-user-id and accept-language —
 * and only override `baseURL` per request. Same pattern the in-chat
 * consent card has used in production (`chat/connectorCatalogCache.ts`).
 */
const authApi = () => ({ baseURL: `${getBaseUrlAuth()}/api/v1` });

export type ConnectionStatus =
  | 'active'
  | 'expired'
  | 'revoked'
  | 'pending'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'PENDING';

export interface IConnectionProfile {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  [key: string]: unknown;
}

export type IBrowserConnectionDevice = IBrowserDevice;

/** A localized OAuth permission entry returned by the catalog endpoint.
 *  ``id`` is the raw upstream OAuth scope (e.g. ``channels:read``,
 *  ``https://www.googleapis.com/auth/drive.readonly``); ``label`` and
 *  ``desc`` are pre-localized server-side based on the request's
 *  ``Accept-Language`` header — no client-side i18n table needed. */
export interface IConnectorPermission {
  id: string;
  label: string;
  desc: string;
}

/** A localized hand-curated "Try It" chat prompt surfaced on the
 *  connector detail pane. ``prompt`` is pre-localized server-side
 *  via ``Accept-Language`` (same Translation pipeline that powers
 *  ``IConnectorPermission.label/desc``). ``model_group`` is a
 *  Studio chat backbone (``claude`` / ``gemini`` / ``grok`` /
 *  ``deepseek`` / ``kimi``); defaults to ``claude`` server-side
 *  when the manifest leaves it empty. */
export interface IConnectorSuggestion {
  id: string;
  prompt: string;
  model_group: string;
}

export interface IConnection {
  id: string;
  revision: number;
  wire_contract_digest: string;
  browser_device_id?: string | null;
  browser_device?: IBrowserConnectionDevice | null;
  provider: string;
  method_id: string;
  execution_type: ConnectorExecutionType;
  credential_type: ConnectorCredentialType;
  method_snapshot: IConnectorConnectionMethod;
  server_url: string;
  scopes: string[];
  profile: IConnectionProfile;
  status: ConnectionStatus;
  supports_refresh: boolean;
  expires_at: string | null;
  last_refreshed_at: string | null;
  last_used_at: string | null;
  last_error: string | null;
  metadata: Record<string, unknown>;
  browser_policy_revision?: number | null;
  browser_policy_digest?: string | null;
  /** Identifier of the connector this connection was installed from
   * (empty string for legacy / non-connector installs). The frontend
   * joins on this id (or falls back to ``<provider>/<provider>`` for
   * preset rows) against ``GET /connectors/`` to render display fields
   * like ``name``, ``icon_url``, ``description``, and the
   * ``permissions[]`` catalog. */
  connector_identifier?: string;
  /** Multi-account: a user may hold several accounts of one connector.
   *  ``label`` is a user-set nickname (empty → fall back to the profile
   *  name/login/email); ``is_default`` marks the account everything acts
   *  as unless told otherwise; ``account_seq`` is the per-connector slot. */
  label?: string;
  is_default?: boolean;
  account_seq?: number;
  created_at: string;
  updated_at: string;
}

export interface IConnectionAuthorizeRequest {
  provider: string;
  /** Raw upstream OAuth scope strings to request at consent time
   *  (subset of the catalog row's ``permissions[].id``). When omitted
   *  the adapter falls back to its ``default_scopes``. */
  scopes?: string[];
  return_url?: string;
}

export interface IConnectionAuthorizeResponse {
  authorization_url: string;
}

export interface IConnectionAuthorizeCustomRequest {
  name?: string;
  server_url: string;
  client_id?: string;
  client_secret?: string;
  return_url?: string;
  provider?: 'mcp';
}

export interface IConnectionAuthorizeCustomResponse {
  authorization_url: string;
  connection_id: string;
}

export interface IConnectionExchangeCustomRequest {
  code: string;
  state: string;
}

export interface IConnectionExchangeCustomResponse {
  status: 'success';
  provider: string;
  connection_id: string;
  return_url: string;
}

export interface IConnectionRefreshResponse {
  status: ConnectionStatus;
  expires_at: string | null;
}

export interface IConnectionTool {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}

export interface IConnectionToolsResponse {
  items: IConnectionTool[];
}

// ---------------------------------------------------------------------------
// Connector catalog ("Browse connectors") — backed by AuthBackend's
// /api/v1/connectors/ endpoints (legacy alias /api/v1/connections/catalog/
// still works through Stage 2 of the rename rollout). Read APIs landed in
// PR #78, install dispatch in PR #79.
// ---------------------------------------------------------------------------

export type ConnectorSource = 'official' | 'partner' | 'public';
export type ConnectorExecutionType =
  | 'skill'
  | 'remote_mcp'
  | 'browser_device'
  | 'local_mcp'
  | 'client_tool'
  | 'api_proxy'
  | 'workflow'
  | 'webhook';
export type ConnectorCredentialType =
  | 'none'
  | 'oauth2'
  | 'user_secret'
  | 'cookie_jar'
  | 'browser_session'
  | 'service_account';

/** One field in a ``byoc`` connector's install form. Mirrors
 *  AuthBackend's ``ConnectorCatalogItem.credential_schema`` shape. */
export interface IConnectorCredentialField {
  /** Submission key (snake_case) — also the JSON dict key in the
   *  payload posted back to the credentials endpoint. */
  key: string;
  /** zh-cn UI label. Wrapped in i18n at render time via the same
   *  Translation rows the backend builds for the catalog name. */
  label: string;
  /** Form widget. ``text`` and ``password`` map to ``<el-input>``;
   *  ``select`` maps to ``<el-select>`` against ``options``. */
  type: 'text' | 'password' | 'select' | 'cookies';
  required?: boolean;
  /** Marks the field as a secret — masked at input time and never
   *  echoed back in API responses. UI defaults ``type=password`` to
   *  this regardless of the explicit flag. */
  secret?: boolean;
  default?: string;
  /** Required for ``type=select``. */
  options?: string[];
  /** Optional zh-cn helper text rendered under the input. */
  help?: string;
}

export interface IConnectorConnectionMethod {
  id: string;
  label?: string;
  description?: string;
  recommended?: boolean;
  execution: {
    type: ConnectorExecutionType;
    server_url?: string;
    required_skills?: string[];
    provider?: string;
    origins?: string[];
    capabilities?: string[];
  };
  credential: {
    type: ConnectorCredentialType;
    provider_id?: string;
    credential_schema?: IConnectorCredentialField[];
    source?: string;
    cookie_domains?: string[];
    login_url?: string;
    scopes?: string[];
  };
  permissions?: IConnectorPermission[];
}

export interface IConnectorCatalogItem {
  id: string;
  identifier: string;
  namespace: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  icon_url: string;
  home_url: string;
  source: ConnectorSource;
  /** Non-empty list of ways to connect this connector. When it has more
   *  than one entry the install UI shows a method picker; a single-method
   *  connector installs directly from the selected canonical method.
   *  ``server_url`` / ``preset_provider_id`` / ``credential_schema``
   *  fields (AuthBackend PR #263). Use ``resolveConnectorMethod`` to pick
   *  the effective method. */
  connection_methods: IConnectorConnectionMethod[];
  recommended_method_id?: string;
  category: string;
  tags: string[];
  acedata_service_alias: string;
  /** Flat list of every OAuth scope this connector can ever grant,
   *  pre-localized by the backend. Each entry's ``id`` is the raw
   *  upstream scope string (the same shape that goes into the OAuth
   *  ``?scope=`` param at install time and the same shape that comes
   *  back on ``Connection.scopes``). For ``byoc`` / ``public`` connectors
   *  this is an empty array. */
  permissions: IConnectorPermission[];
  /** Hand-curated "Try It" chat prompts surfaced on the connector
   *  detail pane. Each entry deep-links to
   *  ``studio.acedata.cloud/<model_group>/conversations?query=<prompt>``.
   *  ``prompt`` is pre-localized server-side via ``Accept-Language``;
   *  ``model_group`` defaults to ``claude`` (Studio's strongest
   *  tool-call backbone for MCP today). Empty array hides the
   *  section. Curated in
   *  ``AuthBackend/app/seeds/connectors*.yaml``; see PR #94 there. */
  suggestions: IConnectorSuggestion[];
  /** Whether the upstream OAuth flow returns a refresh token. ``true``
   *  for ``oauth_dcr`` (until proven otherwise), provider-specific for
   *  ``oauth_static``, ``false`` for the non-OAuth flavours. */
  supports_refresh: boolean;
  publisher: string;
  publisher_logo_url: string;
  license: string;
  upstream_doc_url: string;
  popularity_rank: number;
  install_count: number;
  is_new: boolean;
  is_trending: boolean;
  is_featured: boolean;
  installable: boolean;
  metadata: Record<string, unknown>;
  /** Stamped by the list endpoint; true when the calling user already
   * has an active install for this catalog item. */
  installed: boolean;
  /** Stamped by the list endpoint; how many accounts the calling user has
   * connected for this connector. Optional so an older backend (which only
   * sent ``installed``) still renders — treat missing as "1 when installed". */
  account_count?: number;
  created_at: string;
  last_synced_at: string;
}

export interface IConnectorCatalogListResponse {
  total: number;
  limit: number;
  offset: number;
  items: IConnectorCatalogItem[];
}

export interface IConnectorCatalogListQuery {
  q?: string;
  source?: ConnectorSource;
  category?: string;
  execution_type?: ConnectorExecutionType;
  credential_type?: ConnectorCredentialType;
  tag?: string;
  featured?: boolean;
  sort?: 'popular' | 'new' | 'name';
  limit?: number;
  offset?: number;
}

export interface IConnectorCatalogCategoriesResponse {
  facets: Array<{ source: ConnectorSource; category: string; count: number }>;
}

export interface IConnectorCatalogInstallRequest {
  return_url?: string;
  /** Raw upstream OAuth scope strings to request at consent time
   *  (subset of the row's ``permissions[].id``). When omitted the
   *  preset adapter falls back to its ``default_scopes``. */
  scopes?: string[];
  /** Which of the connector's ``connection_methods`` to install. Omit for
   *  single-method connectors; the backend defaults to the recommended
   *  method. */
  method_id?: string;
  browser_device_id?: string;
  /** Add another account of this connector instead of re-authorizing the
   *  existing one. Omitted/false keeps the historical overwrite behaviour. */
  create_new?: boolean;
}

/** Three-shape install response: redirect (OAuth flows), form
 *  (``byoc`` — caller must collect credentials and POST them to
 *  ``credentials``), or active (zero-step). */
export type IConnectorCatalogInstallResponse =
  | {
      type: 'redirect';
      authorization_url: string;
      state: string;
      connection_id?: string;
    }
  | {
      type: 'form';
      schema: IConnectorCredentialField[];
      identifier: string;
    }
  | {
      type: 'active';
      connection_id: string;
      status: ConnectionStatus;
      browser_device?: IBrowserConnectionDevice;
      installed_skills?: string[];
    };

export interface IConnectorCatalogCredentialsRequest {
  /** Flat ``{key: value}`` dict; keys must match the row's
   *  ``credential_schema[].key``. The backend validates against the
   *  schema and drops unknown keys before encrypting + storing.
   *  Values are strings for text/password/select fields, or a browser
   *  cookie-jar array for ``type=cookies`` fields (captured by the ACE
   *  extension). */
  payload: Record<string, unknown>;
  /** Which of the connector's ``connection_methods`` these credentials belong
   *  to. Omit for single-method connectors. */
  method_id?: string;
  /** Create a second account rather than replacing the existing one. The new
   *  account is named afterwards via ``rename`` — at submit time the upstream
   *  identity isn't known yet, so there is nothing sensible to name it. */
  create_new?: boolean;
}

/** Pick the effective connection method for a catalog item: an explicit
 *  ``methodId`` match wins, else the ``recommended`` method, else the
 *  first entry. Returns ``undefined`` only when the item is null/undefined
 *  or (defensively) has no methods — callers should treat that as "not
 *  installable". */
export function resolveConnectorMethod(
  item: IConnectorCatalogItem | null | undefined,
  methodId?: string
): IConnectorConnectionMethod | undefined {
  const methods = getConnectorMethods(item);
  if (methods.length === 0) return undefined;
  if (methodId) {
    const match = methods.find((m) => m.id === methodId);
    if (match) return match;
  }
  if (item?.recommended_method_id) {
    const recommended = methods.find((m) => m.id === item.recommended_method_id);
    if (recommended) return recommended;
  }
  return methods.find((m) => m.recommended) || methods[0];
}

export function getConnectorMethods(item: IConnectorCatalogItem | null | undefined): IConnectorConnectionMethod[] {
  return item?.connection_methods || [];
}

class ConnectionOperator {
  key = 'connections';

  async list(): Promise<AxiosResponse<IConnection[]>> {
    return httpClient.get(`/${this.key}/`, authApi());
  }

  async authorize(payload: IConnectionAuthorizeRequest): Promise<AxiosResponse<IConnectionAuthorizeResponse>> {
    return httpClient.post(`/${this.key}/authorize/`, payload, authApi());
  }

  async authorizeCustom(
    payload: IConnectionAuthorizeCustomRequest
  ): Promise<AxiosResponse<IConnectionAuthorizeCustomResponse>> {
    return httpClient.post(`/${this.key}/authorize-custom/`, payload, authApi());
  }

  async exchangeCustom(
    id: string,
    payload: IConnectionExchangeCustomRequest
  ): Promise<AxiosResponse<IConnectionExchangeCustomResponse>> {
    return httpClient.post(`/${this.key}/${id}/exchange-custom/`, payload, authApi());
  }

  async refresh(id: string): Promise<AxiosResponse<IConnectionRefreshResponse>> {
    return httpClient.post(`/${this.key}/${id}/refresh/`, undefined, authApi());
  }

  async setDefault(id: string): Promise<AxiosResponse<{ id: string; is_default: boolean }>> {
    return await httpClient.post(`/connections/${id}/set-default/`, undefined, authApi());
  }

  async rename(id: string, label: string): Promise<AxiosResponse<IConnection>> {
    return await httpClient.patch(`/connections/${id}/`, { label }, authApi());
  }

  async disconnect(id: string): Promise<AxiosResponse<void>> {
    return httpClient.delete(`/${this.key}/${id}/`, authApi());
  }

  async rebindBrowserDevice(id: string, browserDeviceId: string): Promise<AxiosResponse<IConnection>> {
    return httpClient.put(`/${this.key}/${id}/browser-device/`, { browser_device_id: browserDeviceId }, authApi());
  }

  async stopBrowserSessions(id: string): Promise<AxiosResponse<{ stopped_session_count: number }>> {
    return httpClient.post(`/${this.key}/${id}/browser-sessions/stop/`, undefined, authApi());
  }

  /**
   * Fetch the live `tools/list` response from a dynamically registered MCP server.
   * Only meaningful for `remote_mcp` methods with OAuth credentials.
   */
  async tools(id: string): Promise<AxiosResponse<IConnectionToolsResponse>> {
    return httpClient.get(`/${this.key}/${id}/tools/`, authApi());
  }

  // -- catalog -------------------------------------------------------------
  // Backed by AuthBackend's `/api/v1/connectors/` viewset (formerly
  // mounted under `/api/v1/connections/catalog/`; the legacy alias was
  // removed in Stage 3, so callers MUST hit `/connectors/` directly).

  async listCatalog(query: IConnectorCatalogListQuery = {}): Promise<AxiosResponse<IConnectorCatalogListResponse>> {
    return httpClient.get(`/connectors/`, { ...authApi(), params: query });
  }

  async getCatalogItem(id: string): Promise<AxiosResponse<IConnectorCatalogItem>> {
    return httpClient.get(`/connectors/${id}/`, authApi());
  }

  async catalogCategories(): Promise<AxiosResponse<IConnectorCatalogCategoriesResponse>> {
    return httpClient.get(`/connectors/categories/`, authApi());
  }

  async installFromCatalog(
    id: string,
    payload: IConnectorCatalogInstallRequest = {}
  ): Promise<AxiosResponse<IConnectorCatalogInstallResponse>> {
    return httpClient.post(`/connectors/${id}/install/`, payload, authApi());
  }

  /** Step 2 of the ``byoc`` install: post the user-filled credential
   *  form. Returns the same ``{type: 'active', ...}`` shape as a
   *  zero-step install so callers can flip the card to "Connected"
   *  without an extra round trip. */
  async submitCatalogCredentials(
    id: string,
    payload: IConnectorCatalogCredentialsRequest
  ): Promise<AxiosResponse<Extract<IConnectorCatalogInstallResponse, { type: 'active' }>>> {
    return httpClient.post(`/connectors/${id}/credentials/`, payload, authApi());
  }
}

export const connectionOperator = new ConnectionOperator();
