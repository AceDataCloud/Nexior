import axios, { AxiosResponse } from 'axios';
import { IQrartGenerateRequest, IQrartGenerateResponse, IQrartTaskResponse, IQrartTasksResponse } from '@/models';
import { BASE_URL_API } from '@/constants';

class QrartOperator {
  async task(id: string, options: { token: string }): Promise<AxiosResponse<IQrartTaskResponse>> {
    return await axios.post(
      `/qrart/tasks`,
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
  ): Promise<AxiosResponse<IQrartTasksResponse>> {
    return await axios.post(
      `/qrart/tasks`,
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
    data: IQrartGenerateRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IQrartGenerateResponse>> {
    return await axios.post('/qrart/generate', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/x-ndjson'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const qrartOperator = new QrartOperator();
