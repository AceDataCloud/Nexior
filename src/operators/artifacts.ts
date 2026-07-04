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

const BASE = `${BASE_URL_API}/aichat2/artifacts`;

export type IArtifactKind =
  | 'article'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'email'
  | 'message'
  | 'dataset'
  | 'link'
  | 'other';

export type IArtifactStatus = 'delivered' | 'draft' | 'failed';
export type IArtifactSource = 'tool' | 'auto';

export interface IArtifact {
  id: string;
  user_id: string;
  application_id?: string;
  conversation_id?: string;
  scheduled_task_id?: string;
  run_id?: string;
  site_origin?: string;
  kind: IArtifactKind;
  status: IArtifactStatus;
  title: string;
  summary?: string;
  url?: string;
  preview_url?: string;
  mime_type?: string;
  size?: number;
  channel?: string;
  target?: string;
  source: IArtifactSource;
  tool_name?: string;
  hidden?: boolean;
  tags?: string[];
  created_at: number;
}

export interface IArtifactFilter {
  scheduled_task_id?: string;
  run_id?: string;
  conversation_id?: string;
  kind?: IArtifactKind;
  status?: IArtifactStatus;
  include_hidden?: boolean;
  offset?: number;
  limit?: number;
}

export interface IArtifactSummary {
  total: number;
  by_kind: Record<string, number>;
}

class ArtifactsOperator {
  async list(token: string, filter: IArtifactFilter = {}): Promise<{ items: IArtifact[]; count: number }> {
    const { data } = await axios.post(BASE, { action: 'retrieve_batch', ...filter }, { headers: headers(token) });
    return { items: data?.items ?? [], count: data?.count ?? 0 };
  }

  async retrieve(token: string, id: string): Promise<IArtifact> {
    const { data } = await axios.post(BASE, { action: 'retrieve', id }, { headers: headers(token) });
    return data;
  }

  async summary(token: string, filter: IArtifactFilter = {}): Promise<IArtifactSummary> {
    const { data } = await axios.post(BASE, { action: 'retrieve_summary', ...filter }, { headers: headers(token) });
    return { total: data?.total ?? 0, by_kind: data?.by_kind ?? {} };
  }

  async hide(token: string, id: string, hidden = true): Promise<void> {
    await axios.post(BASE, { action: 'hide', id, hidden }, { headers: headers(token) });
  }

  async remove(token: string, id: string): Promise<void> {
    await axios.post(BASE, { action: 'delete', id }, { headers: headers(token) });
  }
}

export const artifactsOperator = new ArtifactsOperator();
