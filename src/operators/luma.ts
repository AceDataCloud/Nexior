import axios, { AxiosResponse } from 'axios';
import { ILumaGenerateRequest, ILumaGenerateResponse, ILumaTaskResponse, ILumaTasksResponse } from '@/models';
import { BASE_URL_API } from '@/constants';

class LumaOperator {
  async task(id: string, options: { token: string }): Promise<AxiosResponse<ILumaTaskResponse>> {
    return await axios.post(
      `/luma/tasks`,
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
    filter: { ids?: string[]; applicationId?: string; userId?: string; limit?: number; offset?: number },
    options: { token: string }
  ): Promise<AxiosResponse<ILumaTasksResponse>> {
    return await axios.post(
      `/luma/tasks`,
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
        ...(filter.limit !== undefined
          ? {
              limit: filter.limit
            }
          : {}),
        ...(filter.offset !== undefined
          ? {
              offset: filter.offset
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
    data: ILumaGenerateRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ILumaGenerateResponse>> {
    return await axios.post('/luma/videos', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/x-ndjson'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const lumaOperator = new LumaOperator();
