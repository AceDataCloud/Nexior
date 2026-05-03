/**
 * BYOK ("Bring Your Own Key") — types for user-supplied upstream API
 * credentials. Mirrors the public schema of `POST /aichat2/credentials`
 * served by PlatformService/aichat2 (see PR
 * https://github.com/AceDataCloud/PlatformService/pull/817).
 */

export type IBYOKProvider = 'openai' | 'anthropic' | 'google' | 'xai' | 'deepseek' | 'moonshot' | 'zhipu';

export interface IBYOKProviderInfo {
  id: IBYOKProvider;
  label: string;
  default_base_url: string;
  groups: ReadonlyArray<string>;
}

export interface IBYOKCredential {
  id: string;
  provider: IBYOKProvider;
  provider_label: string;
  /** Empty string → row uses the provider default base URL. */
  base_url: string;
  /** "sk-...XXXX" — never the plaintext key. */
  api_key_masked: string;
  label: string;
  is_active: boolean;
  /** Unix seconds. */
  created_at: number;
  updated_at: number;
  last_used_at: number | null;
}

export interface IBYOKCredentialCreatePayload {
  provider: IBYOKProvider;
  api_key: string;
  base_url?: string;
  label?: string;
  is_active?: boolean;
}

export interface IBYOKCredentialUpdatePayload {
  api_key?: string;
  base_url?: string;
  label?: string;
  is_active?: boolean;
}

export interface IBYOKListResponse {
  items: IBYOKCredential[];
}

export interface IBYOKProvidersResponse {
  providers: IBYOKProviderInfo[];
}

export interface IBYOKTestResponse {
  ok: boolean;
  status?: number;
  message?: string;
}
