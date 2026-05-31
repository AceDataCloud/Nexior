import { AxiosResponse } from 'axios';
import { httpClient } from './common';
import {
  IApplication,
  IApplicationDetailResponse,
  IApplicationListResponse,
  IApplicationScope,
  IApplicationType
} from '@/models';

export interface IApplicationQuery {
  // ``user_id=me`` is sugar for the caller's id; pass an explicit UUID
  // to look up someone else (superuser only). Repeatable.
  user_id?: string | string[];
  offset?: number;
  limit?: number;
  type?: IApplicationType | IApplicationType[];
  service_id?: string | string[];
  ordering?: string;
  scope?: IApplicationScope | IApplicationScope[];
  // Credential-as-Authorization (PR #561): only meaningful when
  // ``user_id`` is set. Repeat ``affiliation=owner`` and/or
  // ``affiliation=granted`` to scope to apps the subject owns, apps
  // someone granted the subject (they hold a credential but are not the
  // owner), or the union of both. Defaults to ``owner`` when ``user_id``
  // is set. Serialized as repeated query params via axios paramsSerializer
  // (qs.stringify with arrayFormat: 'repeat').
  affiliation?: Array<'owner' | 'granted'> | 'owner' | 'granted';
}

class ApplicationOperator {
  key = 'applications';

  async getAll(query: IApplicationQuery): Promise<AxiosResponse<IApplicationListResponse>> {
    return await httpClient.get(`/${this.key}/`, {
      params: query
    });
  }

  async get(id: string): Promise<AxiosResponse<IApplicationDetailResponse>> {
    return await httpClient.get(`/${this.key}/${id}`);
  }

  async create(data: IApplication): Promise<AxiosResponse<IApplicationDetailResponse>> {
    return await httpClient.post(`/${this.key}/`, data);
  }

  async update(id: string, data: IApplication): Promise<AxiosResponse<IApplicationDetailResponse>> {
    return await httpClient.put(`/${this.key}/${id}`, data);
  }

  async updateAllConsumeGlobal(id: string, data: IApplication): Promise<AxiosResponse<IApplicationDetailResponse>> {
    return await httpClient.post(`/${this.key}/${id}/update-allow-consume-global/`, data);
  }

  async delete(id: string): Promise<AxiosResponse<null>> {
    return await httpClient.delete(`/${this.key}/${id}`);
  }
}

export const applicationOperator = new ApplicationOperator();
