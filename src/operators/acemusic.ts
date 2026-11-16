import axios from 'axios';
import { BASE_URL_API, ACEMUSIC_DEFAULT_MODEL } from '@/constants';
import type {
  IAcemusicAudioRequest,
  IAcemusicConfig,
  IAcemusicResponse,
  IAcemusicTask,
  IAcemusicTaskFilter
} from '@/models';
import type { OperatorRequestOptions } from './x402';

export function buildAcemusicAudioRequest(config?: IAcemusicConfig): IAcemusicAudioRequest {
  const common = {
    action: 'generate' as const,
    model: config?.model || ACEMUSIC_DEFAULT_MODEL,
    custom: Boolean(config?.custom),
    async: true as const
  };
  return common.custom
    ? { ...common, lyric: config?.lyric?.trim(), title: config?.title?.trim(), style: config?.style?.trim() }
    : { ...common, prompt: config?.prompt?.trim() };
}

class AcemusicOperator {
  private post<T>(path: string, data: unknown, options: OperatorRequestOptions) {
    if (options.mode === 'x402' || !options.token) throw new Error('An application API key is required');
    return axios.post<T>(path, data, {
      baseURL: BASE_URL_API,
      headers: { authorization: `Bearer ${options.token}`, 'content-type': 'application/json' }
    });
  }
  audio(data: IAcemusicAudioRequest, options: OperatorRequestOptions) {
    return this.post<IAcemusicResponse>('/acemusic/audios', data, options);
  }
  lyrics(data: { prompt: string; style?: string }, options: OperatorRequestOptions) {
    return this.post<{
      success?: boolean;
      task_id?: string;
      data?: Array<{ title?: string; text?: string }>;
      error?: { message?: string };
    }>('/acemusic/lyrics', data, options);
  }
  task<T = IAcemusicTask>(id: string, options: OperatorRequestOptions) {
    return this.post<T>('/acemusic/tasks', { action: 'retrieve', id }, options);
  }
  tasks(filter: IAcemusicTaskFilter, options: OperatorRequestOptions) {
    return this.post<{ count: number; items: IAcemusicTask[] }>(
      '/acemusic/tasks',
      {
        action: filter.ids ? 'retrieve_batch' : 'list',
        ...(filter.ids
          ? { ids: filter.ids }
          : { type: 'audios', limit: filter.limit ?? 10, offset: filter.offset ?? 0 }),
        ...(filter.createdAtMin !== undefined ? { created_at_min: filter.createdAtMin } : {}),
        ...(filter.createdAtMax !== undefined ? { created_at_max: filter.createdAtMax } : {})
      },
      options
    );
  }
}
export const acemusicOperator = new AcemusicOperator();
