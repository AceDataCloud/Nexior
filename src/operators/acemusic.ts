import axios from 'axios';
import { ACEMUSIC_ASSET_TYPES } from '@/models/acemusic';
import { BASE_URL_API, ACEMUSIC_DEFAULT_MODEL } from '@/constants';
import type {
  IAcemusicAsset,
  IAcemusicAssetUpload,
  AcemusicAssetType,
  IAcemusicAudioRequest,
  IAcemusicConfig,
  IAcemusicResponse,
  IAcemusicTask,
  IAcemusicTaskFilter
} from '@/models';
import type { OperatorRequestOptions } from './x402';
type AcemusicRequestOptions = OperatorRequestOptions & { idempotencyKey?: string };

export function buildAcemusicAudioRequest(config?: IAcemusicConfig): IAcemusicAudioRequest {
  const action = config?.action || 'generate';
  if (action === 'upload')
    return {
      action,
      audio_url: config?.audio_url?.trim(),
      ...(config?.name?.trim() ? { name: config.name.trim() } : {}),
      ...(config?.audio_id ? { audio_id: config.audio_id } : {}),
      async: true
    };
  if (action === 'cover' || action === 'mashup')
    return {
      action,
      model: 'acemusic-v1.1',
      lyric: config?.lyric?.trim(),
      style: config?.style?.trim(),
      ...(config?.title?.trim() ? { title: config.title.trim() } : {}),
      ...(action === 'cover' ? { audio_id: config?.audio_id } : { mashup_audio_ids: config?.mashup_audio_ids || [] }),
      audio_influence: config?.audio_influence ?? 60,
      async: true
    };
  const common = {
    action: 'generate' as const,
    model: config?.model || ACEMUSIC_DEFAULT_MODEL,
    custom: Boolean(config?.custom),
    async: true as const
  };
  return common.custom
    ? { ...common, lyric: config?.lyric?.trim(), title: config?.title?.trim(), style: config?.style?.trim() }
    : {
        ...common,
        prompt: config?.prompt?.trim(),
        ...(config?.asset_id || config?.asset_type ? { asset_id: config.asset_id, asset_type: config.asset_type } : {})
      };
}

export function isAcemusicRequestValid(request: IAcemusicAudioRequest): boolean {
  if (request.action === 'upload') {
    try {
      const url = new URL(request.audio_url || '');
      return url.protocol === 'https:' && !url.username && !url.password && !url.hash;
    } catch {
      return false;
    }
  }
  if (request.action === 'cover' || request.action === 'mashup')
    return Boolean(
      request.lyric &&
      request.style &&
      (request.action === 'cover'
        ? request.audio_id
        : request.mashup_audio_ids?.length === 2 && new Set(request.mashup_audio_ids).size === 2)
    );
  if (request.asset_id !== undefined || request.asset_type !== undefined) {
    return Boolean(
      request.asset_id?.trim() &&
      request.asset_type &&
      ACEMUSIC_ASSET_TYPES.includes(request.asset_type) &&
      !request.custom &&
      request.model === 'acemusic-v1.1' &&
      request.prompt?.trim()
    );
  }
  return Boolean(request.custom ? request.lyric && request.style && request.title : request.prompt);
}

class AcemusicOperator {
  private post<T>(path: string, data: unknown, options: AcemusicRequestOptions) {
    if (options.mode === 'x402' || !options.token) throw new Error('An application API key is required');
    return axios.post<T>(path, data, {
      baseURL: BASE_URL_API,
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey } : {})
      }
    });
  }
  audio(data: IAcemusicAudioRequest, options: AcemusicRequestOptions) {
    return this.post<IAcemusicResponse>('/acemusic/audios', data, options);
  }
  uploadAsset(data: IAcemusicAssetUpload, options: AcemusicRequestOptions) {
    return this.post<{ task_id: string; status: string; data?: IAcemusicAsset }>('/acemusic/assets', data, options);
  }
  asset(id: string, options: AcemusicRequestOptions) {
    return this.post<{ success: boolean; data: IAcemusicAsset }>(
      '/acemusic/assets',
      { action: 'retrieve', id },
      options
    );
  }
  assets(page: number, options: AcemusicRequestOptions, type?: AcemusicAssetType) {
    return this.post<{ items: IAcemusicAsset[]; count: number }>(
      '/acemusic/assets',
      { action: 'retrieve', page, page_size: 20, ...(type ? { type } : {}) },
      options
    );
  }
  lyrics(data: { prompt: string; style?: string }, options: AcemusicRequestOptions) {
    return this.post<{
      success?: boolean;
      task_id?: string;
      data?: Array<{ title?: string; text?: string }>;
      error?: { message?: string };
    }>('/acemusic/lyrics', data, options);
  }
  task<T = IAcemusicTask>(id: string, options: AcemusicRequestOptions) {
    return this.post<T>('/acemusic/tasks', { action: 'retrieve', id }, options);
  }
  tasks(filter: IAcemusicTaskFilter, options: AcemusicRequestOptions) {
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
