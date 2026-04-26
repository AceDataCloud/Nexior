import axios, { AxiosResponse } from 'axios';
import {
  IOpenAIImageEditRequest,
  IOpenAIImageGenerateRequest,
  IOpenAIImageGenerateResponse,
  IOpenAIImageTaskResponse,
  IOpenAIImageTasksResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';

class OpenAIImageOperator {
  async task(id: string, options: { token: string }): Promise<AxiosResponse<IOpenAIImageTaskResponse>> {
    return await axios.post(
      `/openai/tasks`,
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
  ): Promise<AxiosResponse<IOpenAIImageTasksResponse>> {
    return await axios.post(
      `/openai/tasks`,
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
    data: IOpenAIImageGenerateRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IOpenAIImageGenerateResponse>> {
    return await axios.post('/openai/images/generations', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  async edit(
    data: IOpenAIImageEditRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IOpenAIImageGenerateResponse>> {
    const formData = new FormData();
    if (data.model) {
      formData.append('model', data.model);
    }
    if (data.prompt) {
      formData.append('prompt', data.prompt);
    }
    if (data.callback_url) {
      formData.append('callback_url', data.callback_url);
    }
    (data.image_urls || []).forEach((url) => {
      formData.append('image', url);
    });

    return await axios.post('/openai/images/edits', formData, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'multipart/form-data',
        accept: 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const openaiimageOperator = new OpenAIImageOperator();
