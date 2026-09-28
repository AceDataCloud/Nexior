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
import type { OperatorRequestOptions } from './x402';

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

  async tasks(
    filter: ITaskListFilter,
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<IOpenAIImageTasksResponse>> {
    return super.tasks(options.mode === 'x402' ? filter : { ...filter, view: 'summary' }, options);
  }

  async edit(
    data: IOpenAIImageEditRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IOpenAIImageGenerateResponse>> {
    const formData = new FormData();
    if (data.model) formData.append('model', data.model);
    if (data.prompt) formData.append('prompt', data.prompt);
    if (data.size) formData.append('size', data.size);
    if (data.quality) formData.append('quality', data.quality);
    if (data.async) formData.append('async', 'true');
    (data.image_urls || []).forEach((url) => {
      formData.append('image', url);
    });
    return axios.post('/openai/images/edits', formData, {
      baseURL: BASE_URL_API,
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'multipart/form-data',
        accept: 'application/json'
      }
    });
  }
}

export const openaiimageOperator = new OpenAIImageOperator();
