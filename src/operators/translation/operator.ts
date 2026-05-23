import { AxiosResponse } from 'axios';
import { httpClient } from '../common';
import {
  ITranslationCapabilitiesResponse,
  ITranslationDisableRequest,
  ITranslationDisableResponse,
  ITranslationEnableRequest,
  ITranslationEnableResponse
} from './models';

class TranslationOperator {
  key = 'translations';

  async getCapabilities(): Promise<AxiosResponse<ITranslationCapabilitiesResponse>> {
    return await httpClient.get(`/${this.key}/capabilities/`);
  }

  async enable(payload: ITranslationEnableRequest): Promise<AxiosResponse<ITranslationEnableResponse>> {
    return await httpClient.post(`/${this.key}/enable`, payload);
  }

  async disable(payload: ITranslationDisableRequest): Promise<AxiosResponse<ITranslationDisableResponse>> {
    return await httpClient.post(`/${this.key}/disable`, payload);
  }
}

export const translationOperator = new TranslationOperator();
