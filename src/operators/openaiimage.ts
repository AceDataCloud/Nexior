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
    if (data.size) formData.append('size', data.size);
    if (data.quality) formData.append('quality', data.quality);
    if (data.complexity) formData.append('complexity', data.complexity);
    if (data.markup) formData.append('markup', data.markup);
    if (data.output_format) formData.append('output_format', data.output_format);
    if (data.frame_count !== undefined) formData.append('frame_count', String(data.frame_count));
    if (data.frame_duration_ms !== undefined) formData.append('frame_duration_ms', String(data.frame_duration_ms));
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
