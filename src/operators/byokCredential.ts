/**
 * BYOK credential operator.
 *
 * Calls the action-dispatch endpoint `POST /aichat2/credentials` exposed
 * by PlatformService/aichat2. Mirrors the shape and auth model of
 * `chatOperator.getConversation` etc.: raw axios against
 * `${BASE_URL_API}` with an explicit `Authorization: Bearer <token>`,
 * where the token is the user's chat-Application credential token (from
 * the `chat` Vuex module).
 *
 * Why the chat credential? `/aichat2/credentials` lives behind the same
 * Kong route (`/aichat2/*`) as `/aichat2/conversations`, so it
 * authenticates with the same credential. The aichat2 worker only ever
 * reads `ctx.userId` from Kong's injected query string — every chat
 * credential the user owns resolves to the same `user_id`, so one
 * credential is enough.
 */
import axios, { AxiosResponse } from 'axios';
import {
  IBYOKCredential,
  IBYOKCredentialCreatePayload,
  IBYOKCredentialTestPayload,
  IBYOKCredentialUpdatePayload,
  IBYOKListResponse,
  IBYOKProvidersResponse,
  IBYOKTestResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';
import { currentSiteOrigin } from '@/utils';

interface AuthOptions {
  /** Chat-Application credential token. */
  token: string;
}

const ENDPOINT = '/aichat2/credentials';

function authHeaders(token: string) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${token}`,
    // BYOK CRUD is metadata, not chat — skip the platform's billing
    // pre-check the same way `/aichat2/conversations` retrieve / update /
    // delete actions do.
    'x-record-exempt': 'true'
  };
  // Tag the calling Site so the worker can scope BYOK rows per-Site
  // (see PlatformService aichat2 PR feat/byok-site-origin). The helper
  // is shared with chat.ts via @/utils so the two paths can never
  // disagree on what "current Site" means.
  const origin = currentSiteOrigin();
  if (origin) headers['x-site-origin'] = origin;
  return headers;
}

class BYOKCredentialOperator {
  /**
   * List supported providers + their default base URLs. The UI uses this
   * to populate the "add credential" dialog so the registry stays
   * server-driven (a new provider on the worker side appears here on
   * the next page load).
   */
  async providers(options: AuthOptions): Promise<AxiosResponse<IBYOKProvidersResponse>> {
    return await axios.post(
      ENDPOINT,
      { action: 'providers' },
      { headers: authHeaders(options.token), baseURL: BASE_URL_API }
    );
  }

  async list(options: AuthOptions): Promise<AxiosResponse<IBYOKListResponse>> {
    return await axios.post(
      ENDPOINT,
      { action: 'list' },
      { headers: authHeaders(options.token), baseURL: BASE_URL_API }
    );
  }

  async create(payload: IBYOKCredentialCreatePayload, options: AuthOptions): Promise<AxiosResponse<IBYOKCredential>> {
    return await axios.post(
      ENDPOINT,
      { action: 'create', ...payload },
      { headers: authHeaders(options.token), baseURL: BASE_URL_API }
    );
  }

  async update(
    id: string,
    payload: IBYOKCredentialUpdatePayload,
    options: AuthOptions
  ): Promise<AxiosResponse<IBYOKCredential>> {
    return await axios.post(
      ENDPOINT,
      { action: 'update', id, ...payload },
      { headers: authHeaders(options.token), baseURL: BASE_URL_API }
    );
  }

  async delete(id: string, options: AuthOptions): Promise<AxiosResponse<{ id: string; success: boolean }>> {
    return await axios.post(
      ENDPOINT,
      { action: 'delete', id },
      { headers: authHeaders(options.token), baseURL: BASE_URL_API }
    );
  }

  /**
   * Smoke-test the credential against the real upstream's `/models`
   * endpoint. Returns `{ok: false, message}` on failure rather than
   * throwing — the UI wants to show "401 unauthorized" inline.
   */
  async test(payload: IBYOKCredentialTestPayload, options: AuthOptions): Promise<AxiosResponse<IBYOKTestResponse>> {
    return await axios.post(
      ENDPOINT,
      { action: 'test', ...payload },
      { headers: authHeaders(options.token), baseURL: BASE_URL_API }
    );
  }
}

export const byokCredentialOperator = new BYOKCredentialOperator();
