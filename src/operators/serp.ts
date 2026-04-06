import axios, { AxiosResponse } from 'axios';
import { ISerpSearchRequest, ISerpSearchResponse } from '@/models';
import { BASE_URL_API } from '@/constants';

class SerpOperator {
  async search(
    data: ISerpSearchRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISerpSearchResponse>> {
    return await axios.post('/serp/google', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const serpOperator = new SerpOperator();
