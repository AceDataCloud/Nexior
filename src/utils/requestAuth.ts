import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { BASE_URL_API } from '@/constants';

interface RequestAuthRuntime {
  getAccountToken: () => string | undefined;
  isAuthenticated: () => boolean;
  triggerLogin: () => void;
}

let runtime: RequestAuthRuntime = {
  getAccountToken: () => undefined,
  isAuthenticated: () => false,
  triggerLogin: () => undefined
};

export const configureRequestAuth = (next: RequestAuthRuntime): void => {
  runtime = next;
};

export class AuthRequiredError extends Error {
  readonly code = 'auth_required';

  constructor() {
    super('Authentication required');
    this.name = 'AuthRequiredError';
  }
}

export class CredentialNotReadyError extends Error {
  readonly code = 'credential_not_ready';

  constructor() {
    super('Service credential is not ready');
    this.name = 'CredentialNotReadyError';
  }
}

export const isAuthTransitionError = (error: unknown): boolean =>
  error instanceof AuthRequiredError || error instanceof CredentialNotReadyError;

export const requireAccountToken = (): string => {
  const token = runtime.getAccountToken();
  if (typeof token === 'string' && token.trim()) return token;
  runtime.triggerLogin();
  throw new AuthRequiredError();
};

export const requireServiceToken = (token: string | undefined | null): string => {
  if (typeof token === 'string' && token.trim()) return token;
  if (!runtime.isAuthenticated()) {
    runtime.triggerLogin();
    throw new AuthRequiredError();
  }
  throw new CredentialNotReadyError();
};

export const serviceAuthHeaders = (token: string | undefined | null): Record<string, string> => ({
  Authorization: `Bearer ${requireServiceToken(token)}`
});

const bearerToken = (config: InternalAxiosRequestConfig): string | undefined => {
  const header = config.headers?.get?.('authorization') ?? config.headers?.get?.('Authorization');
  if (typeof header !== 'string') return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  if (!token || /^(undefined|null)$/i.test(token)) return undefined;
  return token;
};

const requestOrigin = (config: InternalAxiosRequestConfig): string | undefined => {
  try {
    return new URL(config.url || '', config.baseURL || window.location.origin).origin;
  } catch {
    return undefined;
  }
};

export const installServiceRequestAuthGuard = (client: AxiosInstance = axios): (() => void) => {
  const interceptor = client.interceptors.request.use((config) => {
    if (requestOrigin(config) !== new URL(BASE_URL_API).origin) return config;
    requireServiceToken(bearerToken(config));
    return config;
  });
  return () => client.interceptors.request.eject(interceptor);
};
