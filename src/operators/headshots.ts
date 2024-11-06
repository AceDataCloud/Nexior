import axios, { AxiosResponse } from 'axios';
import {
  IHeadshotsGenerateRequest,
  IHeadshotsGenerateResponse,
  IHeadshotsTaskResponse,
  IHeadshotsTasksResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';

class HeadshotsOperator {
  async task(id: string, options: { token: string }): Promise<AxiosResponse<IHeadshotsTaskResponse>> {
    return await axios.post(
      `/headshots/tasks`,
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
  ): Promise<AxiosResponse<IHeadshotsTasksResponse>> {
    return await axios.post(
      `/headshots/tasks`,
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
    data: IHeadshotsGenerateRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IHeadshotsGenerateResponse>> {
    return await axios.post('/headshots/generate', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/x-ndjson'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const headshotsOperator = new HeadshotsOperator();
