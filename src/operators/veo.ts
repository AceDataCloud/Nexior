import axios, { AxiosResponse } from 'axios';
import { IVeoGenerateRequest, IVeoGenerateResponse, IVeoTaskResponse, IVeoTasksResponse } from '@/models';
import { BASE_URL_API } from '@/constants';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class VeoOperator extends BaseTaskOperator<
  IVeoGenerateRequest,
  IVeoGenerateResponse,
  IVeoTaskResponse,
  IVeoTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/veo/tasks', generatePath: '/veo/videos' });
  }

  // Veo overrides the base `generate` because it dispatches across
  // multiple endpoints (`/veo/videos`, `/veo/upsample`, `/veo/extend`,
  // `/veo/reshoot`, `/veo/objects`) based on `data.action`. Each
  // endpoint accepts a different subset of fields, so we strip the
  // ones it doesn't expect — otherwise the upstream JsonLogic billing
  // rules see noise from stale UI state.
  override async generate(
    data: IVeoGenerateRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IVeoGenerateResponse>> {
    const action = data.action;
    const headers = {
      authorization: `Bearer ${options.token}`,
      'content-type': 'application/json',
      accept: 'application/x-ndjson'
    };
    const config = { headers, baseURL: BASE_URL_API };

    if (action === 'upsample') {
      return await axios.post(
        '/veo/upsample',
        {
          video_id: data.video_id,
          action: data.upsample_action || '1080p',
          ...(data.callback_url ? { callback_url: data.callback_url } : {})
        },
        config
      );
    }
    if (action === 'extend') {
      return await axios.post(
        '/veo/extend',
        {
          video_id: data.video_id,
          model: data.model,
          ...(data.prompt ? { prompt: data.prompt } : {}),
          ...(data.callback_url ? { callback_url: data.callback_url } : {})
        },
        config
      );
    }
    if (action === 'reshoot') {
      return await axios.post(
        '/veo/reshoot',
        {
          video_id: data.video_id,
          motion_type: data.motion_type,
          ...(data.callback_url ? { callback_url: data.callback_url } : {})
        },
        config
      );
    }
    if (action === 'object_insert' || action === 'object_remove') {
      return await axios.post(
        '/veo/objects',
        {
          video_id: data.video_id,
          action: action === 'object_insert' ? 'insert' : 'remove',
          ...(data.prompt ? { prompt: data.prompt } : {}),
          ...(data.image_mask ? { image_mask: data.image_mask } : {})
        },
        config
      );
    }
    // Default: generation flows (text2video / image2video / ingredients2video / get1080p)
    // all hit /veo/videos. Strip frontend-only fields used by other
    // endpoints so JsonLogic billing rules don't see noise.
    const { upsample_action: _u, motion_type: _m, image_mask: _i, ...generatePayload } = data;
    return await axios.post('/veo/videos', generatePayload, config);
  }
}

export const veoOperator = new VeoOperator();
