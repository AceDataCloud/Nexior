import axios, { AxiosResponse } from 'axios';
import { IVeoGenerateRequest, IVeoGenerateResponse, IVeoTaskResponse, IVeoTasksResponse } from '@/models';
import { BASE_URL_API } from '@/constants';

class VeoOperator {
  async task(id: string, options: { token: string }): Promise<AxiosResponse<IVeoTaskResponse>> {
    return await axios.post(
      `/veo/tasks`,
      {
        action: 'retrieve',
        id: id
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`,
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async tasks(
    filter: {
      ids?: string[];
      applicationId?: string;
      userId?: string;
      type?: string;
      limit?: number;
      offset?: number;
      createdAtMax?: number;
      createdAtMin?: number;
    },
    options: { token: string }
  ): Promise<AxiosResponse<IVeoTasksResponse>> {
    return await axios.post(
      `/veo/tasks`,
      {
        action: 'retrieve_batch',
        ...(filter.ids
          ? {
              ids: filter.ids
            }
          : {}),
        ...(filter.applicationId
          ? {
              application_id: filter.applicationId
            }
          : {}),
        ...(filter.userId
          ? {
              user_id: filter.userId
            }
          : {}),
        ...(filter.type
          ? {
              type: filter.type
            }
          : {}),
        ...(filter.limit !== undefined
          ? {
              limit: filter.limit
            }
          : {}),
        ...(filter.offset !== undefined
          ? {
              offset: filter.offset
            }
          : {}),
        ...(filter.createdAtMax !== undefined
          ? {
              created_at_max: filter.createdAtMax
            }
          : {}),
        ...(filter.createdAtMin !== undefined
          ? {
              created_at_min: filter.createdAtMin
            }
          : {})
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`,
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async generate(
    data: IVeoGenerateRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IVeoGenerateResponse>> {
    // Dispatch to the appropriate Veo endpoint based on action. The
    // platform exposes /veo/videos for generation flows and dedicated
    // endpoints for post-processing operations. We strip fields the
    // target endpoint doesn't accept so the upstream JsonLogic billing
    // rules don't see noise from stale UI state.
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
    // Default: generation flows (text2video / image2video / ingredients2video / get1080p) all
    // hit /veo/videos. Strip frontend-only fields used by other endpoints
    // so JsonLogic billing rules don't see noise from stale UI state.
    const { upsample_action: _u, motion_type: _m, image_mask: _i, ...generatePayload } = data;
    return await axios.post('/veo/videos', generatePayload, config);
  }
}

export const veoOperator = new VeoOperator();
