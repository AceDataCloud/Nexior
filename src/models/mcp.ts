export interface IMcpServer {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  transport?: string;
  url: string;
  auth_type?: string;
  auth_token?: string;
  tools_cache?: IMcpTool[];
  is_enabled: boolean;
  created_at?: string;
  /** OAuth status: 'authorized' if tokens exist, undefined otherwise */
  oauth_status?: 'authorized' | 'pending';
  /** Optional metadata; for built-in installs holds builtin_id, icon, tags. */
  metadata?: {
    builtin_id?: string;
    icon?: string;
    tags?: string[];
  } & Record<string, unknown>;
}

export interface IMcpTool {
  name: string;
  description?: string;
}

export interface IMcpServerListResponse {
  items: IMcpServer[];
}

export interface IMcpServerTestResponse {
  success: boolean;
  tools_count?: number;
  tools?: IMcpTool[];
  error?: string;
}

export interface IMcpOAuthStartResponse {
  status: 'redirect' | 'authorized';
  authorization_url?: string;
}

export interface IMcpOAuthCallbackResponse {
  status: 'authorized' | 'error';
  error?: string;
}

export interface IBuiltinMcpServer {
  id: string;
  name: string;
  description: string;
  icon: string;
  url: string;
  transport: string;
  auth_type: 'none' | 'bearer' | 'oauth';
  tags: string[];
  /** True iff the caller has already installed this builtin server. */
  installed: boolean;
}

export interface IBuiltinMcpServerListResponse {
  items: IBuiltinMcpServer[];
}
