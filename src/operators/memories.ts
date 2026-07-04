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

const BASE = `${BASE_URL_API}/aichat2/memories`;

export interface IMemoryEntry {
  id: string;
  topic: string;
  content: string;
  confidence: number;
  source: 'auto' | 'tool' | 'user';
  created_at: number;
  updated_at: number;
}

class MemoriesOperator {
  async list(token: string): Promise<IMemoryEntry[]> {
    const { data } = await axios.post(BASE, { action: 'list' }, { headers: headers(token) });
    return data?.items ?? [];
  }

  async remove(token: string, id: string): Promise<boolean> {
    const { data } = await axios.post(BASE, { action: 'delete', id }, { headers: headers(token) });
    return !!data?.success;
  }

  async clear(token: string): Promise<boolean> {
    const { data } = await axios.post(BASE, { action: 'clear' }, { headers: headers(token) });
    return !!data?.success;
  }
}

export const memoriesOperator = new MemoriesOperator();
export default memoriesOperator;
