import type { AxiosResponse } from 'axios';
import { httpClient } from './common';

export interface ISiteGithubOAuthApp {
  client_id: string | null;
  client_secret_configured: boolean;
  using_platform_default: boolean;
}

export interface ISiteGithubOAuthAppUpdate {
  client_id: string;
  client_secret?: string;
}

class SiteGithubOAuthOperator {
  get(siteId: string): Promise<AxiosResponse<ISiteGithubOAuthApp>> {
    return httpClient.get(`/sites/${siteId}/auth-providers/github/`);
  }

  update(siteId: string, payload: ISiteGithubOAuthAppUpdate): Promise<AxiosResponse<ISiteGithubOAuthApp>> {
    return httpClient.patch(`/sites/${siteId}/auth-providers/github/`, payload);
  }

  remove(siteId: string): Promise<AxiosResponse<void>> {
    return httpClient.delete(`/sites/${siteId}/auth-providers/github/`);
  }
}

export const siteGithubOAuthOperator = new SiteGithubOAuthOperator();
