import axios, { AxiosResponse } from 'axios';
import {
  IMidjourneyImagineRequest,
  IMidjourneyImagineResponse,
  IMidjourneyImagineTaskResponse,
  IMidjourneyImagineTasksResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';

class MidjourneyOperator {
  async task(id: string, options: { token: string }): Promise<AxiosResponse<IMidjourneyImagineTaskResponse>> {
    return await axios.post(
      `/midjourney/tasks`,
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
    filter: { ids?: string[]; applicationId?: string; limit?: number; offset?: number },
    options: { token: string }
  ): Promise<AxiosResponse<IMidjourneyImagineTasksResponse>> {
    return await axios.post(
      `/midjourney/tasks`,
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

  async imagine(
    data: IMidjourneyImagineRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IMidjourneyImagineResponse>> {
    return await axios.post('/midjourney/imagine', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/x-ndjson'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const midjourneyOperator = new MidjourneyOperator();
