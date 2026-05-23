/**
 * In-process cache for AuthBackend's connector catalog (
 * `GET /api/v1/connections/catalog/<id>/`). The consent card renders the
 * upstream brand (logo, localized name, permission descriptions) instead
 * of the opaque catalog identifier the worker emits — see
 * `IConsentRequestEntry.catalog_id`.
 *
 * Why module-level instead of a Vuex module:
 * - The cache is read-only side data and never round-trips back to a
 *   persistence layer. A full Vuex module would add 5+ files and force
 *   wiring into `store/common/{models,state}.ts`; an in-memory `Map` is
 *   sufficient because the data is small (one row per catalog id) and
 *   non-sensitive.
 * - Surviving across consent-card remounts is enough — once the user
 *   reloads the chat tab the catalog will be refetched, which is fine
 *   because the upstream payload rarely changes.
 *
 * Auth: Nexior's `Authorization: Bearer <access_token>` is an AuthBackend
 * JWT (minted by `POST /sso/v1/token`), so the same token works against
 * `auth.acedata.cloud` directly. We reuse the existing `httpClient`
 * instance from `@/operators/common` which already injects the bearer
 * token, fingerprint, x-user-id and accept-language headers — the only
 * override is `baseURL`, which points at AuthBackend instead of
 * PlatformBackend for this single endpoint.
 */
import { httpClient } from '@/operators/common';
import { getBaseUrlAuth } from '@/utils';
import type { AxiosResponse } from 'axios';

/** Localized permission entry on a catalog row — mirrors AuthBackend's
 *  `IConnectorPermission` (server-side translated via Accept-Language). */
export interface IConnectorPermission {
  id: string;
  label: string;
  desc: string;
}

/** Subset of AuthBackend's `IConnectorCatalogItem` fields the consent card
 *  needs — there's no benefit to mirroring the entire schema. Adding more
 *  fields later is safe because the AuthBackend payload is a superset. */
export interface IConnectorCatalogSummary {
  id: string;
  identifier: string;
  name: string;
  short_description: string;
  icon_url: string;
  publisher: string;
  publisher_logo_url: string;
  permissions: IConnectorPermission[];
  auth_mode: string;
}

const cache = new Map<string, IConnectorCatalogSummary>();
const inFlight = new Map<string, Promise<IConnectorCatalogSummary | undefined>>();

/**
 * Fetch one catalog row by id, caching the result in-process. Concurrent
 * calls for the same id de-dupe to a single AuthBackend round-trip. On
 * error the cache stays empty so the next render-cycle retries
 * automatically.
 */
export async function getCatalogItem(catalogId: string): Promise<IConnectorCatalogSummary | undefined> {
  if (!catalogId) return undefined;
  const cached = cache.get(catalogId);
  if (cached) return cached;
  const existing = inFlight.get(catalogId);
  if (existing) return existing;
  const task = (async () => {
    try {
      const response: AxiosResponse<IConnectorCatalogSummary> = await httpClient.get(
        `/connections/catalog/${catalogId}/`,
        { baseURL: `${getBaseUrlAuth()}/api/v1` }
      );
      const item = response.data;
      cache.set(catalogId, item);
      return item;
    } catch (error) {
      // Logged but not surfaced — the card falls back to the slug.
      console.warn('connector catalog fetch failed', catalogId, error);
      return undefined;
    }
  })().finally(() => {
    inFlight.delete(catalogId);
  });
  inFlight.set(catalogId, task);
  return task;
}

/** Test / cleanup helper. */
export function clearConnectorCatalogCache(): void {
  cache.clear();
  inFlight.clear();
}
