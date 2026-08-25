import { AxiosResponse } from 'axios';
import { anonymousHttpClient } from './common';

export interface IAttributionResolveRequest {
  // Token round-tripped via Play Install Referrer (Android) or clipboard (iOS).
  click_id?: string;
  platform?: 'ios' | 'android';
}

export interface IAttributionResolveResponse {
  inviter_id: string | null;
  match_type: 'deterministic' | 'probabilistic' | null;
}

class AttributionOperator {
  /**
   * First-launch deferred-deep-link resolution. The shared anonymousHttpClient already
   * attaches `x-fingerprint`, so the backend can fall back to a probabilistic
   * IP/UA match when no `click_id` is available (iOS without clipboard token).
   */
  async resolve(payload: IAttributionResolveRequest): Promise<AxiosResponse<IAttributionResolveResponse>> {
    return anonymousHttpClient.post('/attribution/resolve/', payload);
  }
}

export const attributionOperator = new AttributionOperator();
