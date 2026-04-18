import axios, { AxiosResponse } from 'axios';
import { BASE_URL_API } from '@/constants';

export interface IAgentStatusResponse {
  connected: boolean;
  name?: string;
  tool_count?: number;
  connected_at?: string;
}

class AgentOperator {
  private getHeaders(token: string) {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  }

  async status(token: string): Promise<AxiosResponse<IAgentStatusResponse>> {
    return await axios.post(
      '/aichat2/agent',
      { action: 'status' },
      { headers: this.getHeaders(token), baseURL: BASE_URL_API }
    );
  }
}

export const agentOperator = new AgentOperator();
