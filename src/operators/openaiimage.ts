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

  async edit(
    data: IOpenAIImageEditRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IOpenAIImageGenerateResponse>> {
    const formData = new FormData();
    if (data.model) formData.append('model', data.model);
    if (data.prompt) formData.append('prompt', data.prompt);
    if (data.callback_url) formData.append('callback_url', data.callback_url);
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
