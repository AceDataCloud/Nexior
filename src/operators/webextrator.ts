import axios, { AxiosResponse } from 'axios';
import { IWebextratorExtractRequest, IWebextratorRenderRequest, IWebextratorResponse } from '@/models';
import { BASE_URL_API } from '@/constants';

class WebextratorOperator {
  async render(
    data: IWebextratorRenderRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IWebextratorResponse>> {
    return await axios.post('/webextrator/render', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      baseURL: BASE_URL_API,
      // Long page renders can legitimately take 60-120s; let the API's own
      // `timeout` field (passed through the body) be the deciding factor and
      // give the network another 30s of headroom on top.
      timeout: 150_000
    });
  }

  async extract(
    data: IWebextratorExtractRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IWebextratorResponse>> {
    return await axios.post('/webextrator/extract', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      baseURL: BASE_URL_API,
      timeout: 180_000
    });
  }
}

export const webextratorOperator = new WebextratorOperator();
