/**
 * AuthBackend `Connection` shape, returned by
 * GET https://auth.acedata.cloud/api/v1/connections/.
 *
 * Two kinds:
 *   - `preset`: a built-in OAuth provider (google / github / slack /
 *     notion / linear / gitlab). Identified by `provider`.
 *   - `custom_oauth`: a user-added MCP server's OAuth connection. The
 *     MCP transport URL is `server_url`; aichat2 uses the connection
 *     id as the MCP server id when launching the transport.
 */
export interface IConnection {
  id: string;
  provider: string;
  kind: 'preset' | 'custom_oauth';
  server_url: string;
  scopes: string[];
  profile?: {
    name?: string;
    email?: string;
    avatar?: string;
    server_name?: string;
    [key: string]: unknown;
  };
  status: 'active' | 'expired' | 'revoked' | 'error';
  expires_at: string | null;
  last_refreshed_at: string | null;
  last_used_at: string | null;
  last_error: string | null;
  metadata?: {
    server_name?: string;
    name?: string;
    icon?: string;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface IConnectionListResponse {
  items: IConnection[];
}

export interface IConnectionRefreshResponse {
  status: string;
  expires_at: string | null;
}
