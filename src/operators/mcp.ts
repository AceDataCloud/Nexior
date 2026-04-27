import axios, { AxiosResponse } from 'axios';
import {
  IMcpServer,
  IMcpServerListResponse,
  IMcpServerTestResponse,
  IMcpOAuthStartResponse,
  IMcpOAuthCallbackResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';

class McpServerOperator {
  private getHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  async list(token: string): Promise<AxiosResponse<IMcpServerListResponse>> {
    return await axios.post(
      '/aichat2/mcp-servers',
      { action: 'list' },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async create(
    data: { name: string; url: string; description?: string; auth_type?: string; auth_token?: string },
    token: string
  ): Promise<AxiosResponse<IMcpServer>> {
    return await axios.post(
      '/aichat2/mcp-servers',
      { action: 'create', ...data },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async update(
    data: {
      id: string;
      name?: string;
      url?: string;
      description?: string;
      auth_type?: string;
      auth_token?: string;
      is_enabled?: boolean;
    },
    token: string
  ): Promise<AxiosResponse<{ id: string; success: boolean }>> {
    return await axios.post(
      '/aichat2/mcp-servers',
      { action: 'update', ...data },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async delete(id: string, token: string): Promise<AxiosResponse<{ id: string; success: boolean }>> {
    return await axios.post(
      '/aichat2/mcp-servers',
      { action: 'delete', id },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async test(
    data: { url: string; auth_type?: string; auth_token?: string },
    token: string
  ): Promise<AxiosResponse<IMcpServerTestResponse>> {
    return await axios.post(
      '/aichat2/mcp-servers',
      { action: 'test', ...data },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async oauthStart(id: string, token: string): Promise<AxiosResponse<IMcpOAuthStartResponse>> {
    return await axios.post(
      '/aichat2/mcp-servers',
      { action: 'oauth_start', id },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }

  async oauthCallback(id: string, code: string, token: string): Promise<AxiosResponse<IMcpOAuthCallbackResponse>> {
    return await axios.post(
      '/aichat2/mcp-servers',
      { action: 'oauth_callback', id, code },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }
}

export const mcpServerOperator = new McpServerOperator();
