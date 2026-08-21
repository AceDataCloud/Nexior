import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import type { IShowcase } from '@/models';
import { getBaseUrlPlatform } from '@/utils/baseUrl';

const CACHE_TTL_MS = 60_000;
const publicClient: AxiosInstance = axios.create({
  baseURL: `${getBaseUrlPlatform()}/api/v1`,
  timeout: 10000
});

interface CacheEntry {
  expiresAt: number;
  request: Promise<AxiosResponse<IShowcase[]>>;
}

class ShowcaseOperator {
  private readonly cache = new Map<string, CacheEntry>();

  list(service?: string, locale = 'en'): Promise<AxiosResponse<IShowcase[]>> {
    const normalizedLocale = locale.trim().toLowerCase() || 'en';
    const key = `${normalizedLocale}:${service || '*'}`;
    const now = Date.now();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > now) return cached.request;
    const request = publicClient.get<IShowcase[]>('/showcases/', {
      headers: { 'Accept-Language': normalizedLocale },
      params: service ? { service } : undefined
    });
    this.cache.set(key, { expiresAt: now + CACHE_TTL_MS, request });
    request.catch(() => this.cache.delete(key));
    return request;
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const showcaseOperator = new ShowcaseOperator();
