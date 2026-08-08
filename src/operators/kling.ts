import axios, { AxiosResponse } from 'axios';
import {
  IKlingConfig,
  IKlingGenerateRequest,
  IKlingGenerateResponse,
  IKlingMotionRequest,
  IKlingTalkingPhotoConfig,
  IKlingTalkingPhotoRequest,
  IKlingTaskResponse,
  IKlingTasksResponse
} from '@/models';
import { BASE_URL_API, KLING_TALKING_PHOTO_DEFAULT_MODEL, KLING_TALKING_PHOTO_DEFAULT_MODE } from '@/constants';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';
import { postWithX402, quoteX402, type OperatorRequestOptions } from './x402';

const X402_HEADERS = { 'content-type': 'application/json', accept: 'application/x-ndjson' };

export function buildKlingVideoRequest(config?: IKlingConfig): IKlingGenerateRequest {
  const { camera_control, ...rest } = config || {};
  const request: IKlingGenerateRequest = { ...rest, async: true };
  if (!request.action) {
    if (request.video_id || request.video_url) request.action = 'extend';
    else if (request.start_image_url) request.action = 'image2video';
    else request.action = 'text2video';
  }
  if (request.action === 'text2video') delete request.end_image_url;
  if (camera_control?.type) {
    request.camera_control = {
      type: camera_control.type,
      ...(camera_control.type === 'simple' && camera_control.config
        ? {
            config: Object.fromEntries(
              Object.entries(camera_control.config).filter(([, value]) => value !== undefined && value !== null)
            )
          }
        : {})
    };
  }
  return request;
}

export function buildKlingTalkingPhotoRequest(config?: IKlingTalkingPhotoConfig): IKlingTalkingPhotoRequest {
  const source = config || {};
  return {
    image_url: source.image_url || '',
    audio_url: source.audio_url || '',
    model: source.model || KLING_TALKING_PHOTO_DEFAULT_MODEL,
    mode: source.mode || KLING_TALKING_PHOTO_DEFAULT_MODE,
    ...(source.prompt ? { prompt: source.prompt } : {}),
    ...(source.duration ? { duration: source.duration } : {}),
    async: true
  };
}

class KlingOperator extends BaseTaskOperator<
  IKlingGenerateRequest,
  IKlingGenerateResponse,
  IKlingTaskResponse,
  IKlingTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/kling/tasks', generatePath: '/kling/videos' });
  }

  async motion(data: IKlingMotionRequest, options: { token: string }): Promise<AxiosResponse<IKlingGenerateResponse>> {
    return axios.post('/kling/motion', data, {
      baseURL: BASE_URL_API,
      headers: { ...X402_HEADERS, authorization: `Bearer ${options.token}` }
    });
  }

  async quoteTalkingPhoto(data: IKlingTalkingPhotoRequest) {
    return quoteX402('/kling/talking-photo', data, X402_HEADERS);
  }

  async talkingPhoto(
    data: IKlingTalkingPhotoRequest,
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<IKlingGenerateResponse>> {
    if (options.mode === 'x402') {
      if (!options.x402) throw new Error('x402 payment options are required');
      return postWithX402<IKlingGenerateResponse>('/kling/talking-photo', data, options.x402, X402_HEADERS);
    }
    return axios.post('/kling/talking-photo', data, {
      baseURL: BASE_URL_API,
      headers: { ...X402_HEADERS, authorization: `Bearer ${options.token}` }
    });
  }
}

export const klingOperator = new KlingOperator();
