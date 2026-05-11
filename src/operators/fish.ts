import axios, { AxiosResponse } from 'axios';
import { BASE_URL_API } from '@/constants';
import {
  IFishModelListResponse,
  IFishTask,
  IFishTaskResponse,
  IFishTasksResponse,
  IFishTtsRequest,
  IFishTtsResponse,
  IFishVoiceModel
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export interface IFishTaskFilter extends ITaskListFilter {
  /**
   * Backend stores TTS jobs under `type=fish_tts` and voice-cloning jobs under
   * `type=fish_model_create`. Pages pass one of those literals.
   */
  type?: string;
}

class FishOperator extends BaseTaskOperator<
  IFishTtsRequest,
  IFishTtsResponse,
  IFishTaskResponse,
  IFishTasksResponse,
  IFishTaskFilter
> {
  constructor() {
    super({ tasksPath: '/fish/tasks', generatePath: '/fish/tts' });
  }

  /**
   * POST /fish/tts — Fish-OpenAPI compatible text-to-speech.
   *
   * The official spec selects the engine via the `model` HTTP header
   * (`s1` or `s2-pro`). The base operator's `generate()` doesn't accept
   * per-call headers, so this thin override keeps the parity with the
   * backend while still routing through `BASE_URL_API` and the user
   * credential token.
   *
   * Always passes the `model` field as a header — never as a body field
   * — so the backend's strict `model: s1|s2-pro` validator doesn't see
   * an unexpected body key.
   */
  async generateTts(
    data: IFishTtsRequest,
    options: { token: string; model?: string }
  ): Promise<AxiosResponse<IFishTtsResponse>> {
    const { model: bodyModel, ...rest } = data;
    const headerModel = options.model ?? bodyModel ?? 's2-pro';
    return axios.post('/fish/tts', rest, {
      baseURL: BASE_URL_API,
      headers: {
        'content-type': 'application/json',
        accept: 'application/x-ndjson',
        model: headerModel,
        authorization: `Bearer ${options.token}`
      }
    });
  }

  /**
   * GET /fish/model — list voice-clone models. Pass `self=true` to
   * scope to the calling user's models. Returns `{total, items, has_more}`.
   */
  async listModels(
    params: { self?: boolean; page_size?: number; page_number?: number; title?: string },
    options: { token: string }
  ): Promise<AxiosResponse<IFishModelListResponse>> {
    return axios.get('/fish/model', {
      baseURL: BASE_URL_API,
      params: {
        self: params.self ?? true,
        page_size: params.page_size ?? 10,
        page_number: params.page_number ?? 1,
        ...(params.title ? { title: params.title } : {})
      },
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${options.token}`
      }
    });
  }

  /** GET /fish/model/:id — single model fetch. */
  async getModel(id: string, options: { token: string }): Promise<AxiosResponse<IFishVoiceModel>> {
    return axios.get(`/fish/model/${id}`, {
      baseURL: BASE_URL_API,
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${options.token}`
      }
    });
  }

  /**
   * POST /fish/model — create a voice clone. The platform's JSON-with-URL
   * variant (`voices` is a single https URL pointing at the reference audio).
   * Async-only when `callback_url` is supplied.
   */
  async createModel(
    data: {
      title: string;
      voices: string;
      description?: string;
      cover_image?: string;
      train_mode?: 'fast' | 'precise';
      type?: 'tts';
      visibility?: 'public' | 'unlist' | 'private';
      tags?: string[];
      texts?: string[];
      enhance_audio_quality?: boolean;
      generate_sample?: boolean;
      callback_url?: string;
    },
    options: { token: string }
  ): Promise<AxiosResponse<IFishTask & { id?: string }>> {
    return axios.post(
      '/fish/model',
      { type: 'tts', ...data },
      {
        baseURL: BASE_URL_API,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          authorization: `Bearer ${options.token}`
        }
      }
    );
  }
}

export const fishOperator = new FishOperator();
