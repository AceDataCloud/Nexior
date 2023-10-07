import axios, { AxiosResponse } from 'axios';
import { IMidjourneyImagineOptions, IMidjourneyImagineRequest, IMidjourneyImagineResponse } from './models';

class MidjourneyOperator {
  async imagine(
    data: IMidjourneyImagineRequest,
    options: IMidjourneyImagineOptions
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
