import axios from 'axios';
import { BASE_URL_API } from '@/constants';
import { currentSiteOrigin } from '@/utils';

function headers(token: string) {
  const origin = currentSiteOrigin();
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...(origin ? { 'x-site-origin': origin } : {})
  };
}

const BASE = `${BASE_URL_API}/aichat2/scheduled-tasks`;

export interface IScheduledTask {
  id: string;
  name: string;
  description?: string;
  state: 'enabled' | 'disabled' | 'error';
  schedule: IScheduleSpec;
  template: {
    model: string;
    question: string;
    skills?: string[];
    mcp_servers?: string[];
    max_turns?: number;
  };
  unattended_policy?: IScheduledTaskUnattendedPolicy;
  run_count: number;
  last_output_snippet?: string;
  last_error?: string;
  created_at: number;
  updated_at: number;
}

export interface IScheduledRun {
  id: string;
  task_id: string;
  status: 'queued' | 'running' | 'success' | 'failed' | 'needs_user_input';
  scheduled_at: number;
  llm_started_at?: number;
  llm_finished_at?: number;
  conversation_id?: string;
  conversation_title?: string;
  conversation_preview?: string;
  conversation_model_group?: string;
  error_code?: string;
  error_message?: string;
}

export type IScheduleSpec =
  | { type: 'cron'; cron: string; tz: string; ends_at?: number }
  | { type: 'interval'; interval_seconds: number; tz: string; ends_at?: number }
  | { type: 'once'; at: number; tz: string };

export interface IScheduledTaskUnattendedPolicy {
  mode: 'deny_all' | 'allow_selected' | 'allow_selected_skills';
  allowed_skills: string[];
  allowed_mcp_servers?: string[];
  expires_at?: number;
}

export interface IAuthorizableSkill {
  slug: string;
  name: string;
  description: string;
  when_to_use?: string;
  required_connections: string[];
  allowed_tools: string[];
  source: string;
  connected: boolean;
  missing_connections: string[];
}

export interface IAuthorizableMcpServer {
  slug: string;
  name: string;
  server_url: string;
}

export interface IAuthorizableCapabilities {
  skills: IAuthorizableSkill[];
  mcp_servers: IAuthorizableMcpServer[];
}

type ScheduledTaskPayload = {
  name: string;
  description?: string;
  schedule: IScheduleSpec;
  template: IScheduledTask['template'];
  unattended_policy?: IScheduledTaskUnattendedPolicy;
};

class ScheduledTasksOperator {
  async listTasks(token: string): Promise<IScheduledTask[]> {
    const { data } = await axios.post(BASE, { action: 'retrieve_batch' }, { headers: headers(token) });
    return data?.items ?? [];
  }

  async createTask(token: string, payload: ScheduledTaskPayload): Promise<IScheduledTask> {
    const { data } = await axios.post(BASE, { action: 'create', ...payload }, { headers: headers(token) });
    return data;
  }

  async updateTask(
    token: string,
    id: string,
    patch: Partial<
      Pick<IScheduledTask, 'name' | 'description' | 'state' | 'template' | 'schedule' | 'unattended_policy'>
    >
  ): Promise<IScheduledTask> {
    const { data } = await axios.post(BASE, { action: 'update', id, ...patch }, { headers: headers(token) });
    return data;
  }

  async deleteTask(token: string, id: string): Promise<void> {
    await axios.post(BASE, { action: 'delete', id }, { headers: headers(token) });
  }

  async listRuns(token: string, id: string): Promise<IScheduledRun[]> {
    const { data } = await axios.post(BASE, { action: 'retrieve_runs', id }, { headers: headers(token) });
    return data?.items ?? [];
  }

  async listAuthorizableSkills(token: string): Promise<IAuthorizableSkill[]> {
    const { data } = await axios.post(BASE, { action: 'retrieve_authorizable_skills' }, { headers: headers(token) });
    return data?.items ?? [];
  }

  async listAuthorizableCapabilities(token: string): Promise<IAuthorizableCapabilities> {
    const { data } = await axios.post(BASE, { action: 'retrieve_authorizable_skills' }, { headers: headers(token) });
    return {
      skills: data?.skills ?? data?.items ?? [],
      mcp_servers: data?.mcp_servers ?? []
    };
  }
}

export const scheduledTasksOperator = new ScheduledTasksOperator();
