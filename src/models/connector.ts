export interface IConnectorProvider {
  id: string;
  name: string;
  description: string;
  icon: string;
  scopes: string[];
  connected: boolean;
  /** True iff the backend has client credentials configured for this provider. */
  available?: boolean;
}

export interface IConnector {
  id: string;
  provider: string;
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };
  scopes: string[];
  is_enabled: boolean;
  expires_at: number;
  created_at: string;
  updated_at: string;
}

export interface IConnectorProvidersResponse {
  providers: IConnectorProvider[];
}

export interface IConnectorListResponse {
  items: IConnector[];
}

export interface IConnectorAuthorizeResponse {
  authorization_url: string;
  provider: string;
}

export interface IConnectorExchangeResponse {
  success: boolean;
  provider: string;
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };
}
