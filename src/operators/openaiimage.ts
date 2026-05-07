import axios, { AxiosResponse } from 'axios';
import {
  IOpenAIImageEditRequest,
  IOpenAIImageGenerateRequest,
  IOpenAIImageGenerateResponse,
  IOpenAIImageTaskResponse,
  IOpenAIImageTasksResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

// Channel hint consumed by Kong canary on /openai/images/* — when this
// header is set to 'xiaojing' the request is steered to the xiaojingai
// upstream (`gpt-image-2-reverse`) instead of the legacy ttapi pool.
// Mirrors the convention used by every other service (suno, veo, sora,
// nano-banana, …): the channel selector lives in the request *header*,
// not the body, so workers don't need to parse / strip it before forwarding.
const OPENAI_IMAGE_CHANNEL_HEADER = 'channel';
const OPENAI_IMAGE_CHANNEL = 'xiaojing';

class OpenAIImageOperator extends BaseTaskOperator<
  IOpenAIImageGenerateRequest,
  IOpenAIImageGenerateResponse,
  IOpenAIImageTaskResponse,
  IOpenAIImageTasksResponse,
  ITaskListFilter
> {
  constructor() {
    super({ tasksPath: '/openai/tasks', generatePath: '/openai/images/generations' });
  }

  async generate(
    data: IOpenAIImageGenerateRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IOpenAIImageGenerateResponse>> {
    return axios.post(this.generatePath, data, {
      baseURL: BASE_URL_API,
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/json',
        [OPENAI_IMAGE_CHANNEL_HEADER]: OPENAI_IMAGE_CHANNEL
      }
    });
  }

  async edit(
    data: IOpenAIImageEditRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IOpenAIImageGenerateResponse>> {
    const formData = new FormData();
    if (data.model) formData.append('model', data.model);
    if (data.prompt) formData.append('prompt', data.prompt);
    if (data.callback_url) formData.append('callback_url', data.callback_url);
    if (data.size) formData.append('size', data.size);
    (data.image_urls || []).forEach((url) => {
      formData.append('image', url);
    });
    return axios.post('/openai/images/edits', formData, {
      baseURL: BASE_URL_API,
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'multipart/form-data',
        accept: 'application/json',
        [OPENAI_IMAGE_CHANNEL_HEADER]: OPENAI_IMAGE_CHANNEL
      }
    });
  }
}

export const openaiimageOperator = new OpenAIImageOperator();
