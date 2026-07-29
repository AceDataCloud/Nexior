import { AxiosResponse } from 'axios';
import {
  IBrowserDevice,
  IBrowserPairingChallenge,
  IBrowserPairingClaim,
  IBrowserPairingConfirmation,
  IBrowserPairingRejection
} from '@/models/browserDevice';
import { httpClient } from './common';
import { getBaseUrlAuth } from '@/utils';

// Browser devices live in AuthBackend — same bearer, different host.
// See the note in ./connection.ts.
const authApi = () => ({ baseURL: `${getBaseUrlAuth()}/api/v1` });

class BrowserDeviceOperator {
  private readonly key = 'browser-devices';

  async list(): Promise<AxiosResponse<IBrowserDevice[]>> {
    return httpClient.get(`/${this.key}/`, authApi());
  }

  async rename(id: string, name: string): Promise<AxiosResponse<IBrowserDevice>> {
    return httpClient.patch(`/${this.key}/${id}/`, { name }, authApi());
  }

  async delete(id: string): Promise<AxiosResponse<void>> {
    return httpClient.delete(`/${this.key}/${id}/`, authApi());
  }

  async createPairingChallenge(): Promise<AxiosResponse<IBrowserPairingChallenge>> {
    return httpClient.post(`/${this.key}/pairing-challenges/`, {}, authApi());
  }

  async listPendingClaims(): Promise<AxiosResponse<IBrowserPairingClaim[]>> {
    return httpClient.get(`/${this.key}/pairing-claims/`, authApi());
  }

  async confirmClaim(
    claimId: string,
    keyFingerprint: string,
    name?: string
  ): Promise<AxiosResponse<IBrowserPairingConfirmation>> {
    return httpClient.post(
      `/${this.key}/pairing-claims/${claimId}/confirm/`,
      {
        key_fingerprint: keyFingerprint,
        ...(name ? { name } : {})
      },
      authApi()
    );
  }

  async rejectClaim(claimId: string, keyFingerprint: string): Promise<AxiosResponse<IBrowserPairingRejection>> {
    return httpClient.post(
      `/${this.key}/pairing-claims/${claimId}/reject/`,
      {
        key_fingerprint: keyFingerprint
      },
      authApi()
    );
  }
}

export const browserDeviceOperator = new BrowserDeviceOperator();
