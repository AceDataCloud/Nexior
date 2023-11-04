import axios, { AxiosResponse } from 'axios';
import { IMidjourneyImagineRequest, IMidjourneyImagineResponse, IMidjourneyImagineTask } from './models';
import { ENDPOINT_API } from '../common/contants';

class MidjourneyOperator {
  async task(id: string): Promise<AxiosResponse<IMidjourneyImagineTask>> {
    return await axios.post(
      `/midjourney/tasks`,
      {
        action: 'retrieve',
        id: id
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        baseURL: ENDPOINT_API
      }
    );
  }

  async tasks(ids: string[]): Promise<AxiosResponse<IMidjourneyImagineTask[]>> {
    return await axios.post(
      `/midjourney/tasks`,
      {
        action: 'retrieve_batch',
        ids: ids
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json'
        },
        baseURL: ENDPOINT_API
      }
    );
  }

  async imagine(
    data: IMidjourneyImagineRequest,
    options: {
      stream: (response: IMidjourneyImagineResponse) => void;
      token: string;
      endpoint: string;
      path: string;
    }
  ): Promise<AxiosResponse<IMidjourneyImagineResponse>> {
    return await axios.post(options.path, data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        accept: 'application/x-ndjson',
        'content-type': 'application/json'
      },
      baseURL: options.endpoint,
      responseType: 'stream',
      onDownloadProgress: (event) => {
        const response = event.target.response;
        const lines = response.split('\r\n').filter((line: string) => !!line);
        const lastLine = lines[lines.length - 1];
        if (lastLine) {
          const jsonData = JSON.parse(lastLine);
          if (options?.stream) {
            options?.stream(jsonData as IMidjourneyImagineResponse);
          }
        }
      }
    });
  }
}

export const midjourneyOperator = new MidjourneyOperator();
