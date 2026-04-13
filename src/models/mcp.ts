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
