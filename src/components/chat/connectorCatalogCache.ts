/**
 * In-process cache for AuthBackend's connector catalog (
 * `GET /api/v1/connectors/<id>/`, legacy alias
 * `GET /api/v1/connections/catalog/<id>/`). The consent card renders
 * the upstream brand (logo, localized name, permission descriptions)
 * instead of the opaque catalog identifier the worker emits — see
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
  /** `true` when the catalog row is in a state where the install endpoint
   *  will provision a connection (currently always `true` for visible
   *  rows, but the field is honored so a feature-flagged row doesn't
   *  break the flow). When `false` the card falls back to emitting the
   *  legacy `authorize` event so the AuthFrontend deep-link install page
   *  can render whatever non-self-serve copy it wants. */
  installable: boolean;
}

/** Response shape of AuthBackend's
 *  `POST /api/v1/connectors/<id>/install/` (legacy alias
 *  `POST /api/v1/connections/catalog/<id>/install/`). See
 *  `app.services.connector_catalog.install_for_user`. */
export interface IConnectorCatalogInstallResponse {
  type: 'redirect' | 'form' | 'active';
  /** Present iff `type === 'redirect'` — the upstream provider's OAuth
   *  authorize URL the browser should navigate to. */
  authorization_url?: string;
  /** Present iff `type === 'form'` — credential schema the AuthFrontend
   *  BYOC dialog renders. The consent card does NOT handle this case
   *  inline; the parent emits the legacy `authorize` event and the user
   *  finishes BYOC on the AuthFrontend install page. */
  schema?: unknown;
}

/** Subset of AuthBackend's `IConnection` fields the consent card needs
 *  to detect which entries are now actively connected for the calling
 *  user. The full schema (profile, scopes, expires_at, …) is ignored —
 *  this is purely a presence + status check keyed on the connector
 *  identifier. */
export interface IUserConnectionSummary {
  id: string;
  /** Connector identifier (e.g. `acedatacloud/google-drive`).
   *  Empty string for legacy / non-connector installs — those rows can't
   *  match a consent entry's `connector` field so they're effectively
   *  ignored. */
  connector_identifier?: string;
  /** Backend ships both lowercase and uppercase variants — see
   *  AuthFrontend `ConnectionStatus`. Callers should compare
   *  case-insensitively. */
  status: string;
}

/** Fetch the calling user's connections from AuthBackend. Used by the
 *  consent card to refresh entry statuses after an OAuth round-trip —
 *  the worker-supplied `entry.status` is frozen at the moment the
 *  pending tool_use was emitted, so a successful install needs a live
 *  re-read to flip the card from "Authorize" to "Connected" + show
 *  the "Continue" CTA.
 *
 *  Throws on network / HTTP errors so the caller can decide whether
 *  to fall back to the stale status or surface a toast. */
export async function listMyConnections(): Promise<IUserConnectionSummary[]> {
  const response: AxiosResponse<IUserConnectionSummary[]> = await httpClient.get(`/connections/`, {
    baseURL: `${getBaseUrlAuth()}/api/v1`
  });
  return Array.isArray(response.data) ? response.data : [];
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
      const response: AxiosResponse<IConnectorCatalogSummary> = await httpClient.get(`/connectors/${catalogId}/`, {
        baseURL: `${getBaseUrlAuth()}/api/v1`
      });
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

/**
 * Provision (or kick off OAuth for) a connection for the calling user.
 * Mirrors AuthFrontend's `connectionOperator.installFromCatalog` — same
 * AuthBackend endpoint, same response shape.
 *
 * Throws on network / HTTP errors so the caller can fall back to the
 * worker-supplied `entry.install_url` deep-link (which AuthFrontend then
 * handles, including BYOC credential forms).
 */
export async function installFromCatalog(
  catalogId: string,
  payload: { scopes?: string[]; return_url: string }
): Promise<IConnectorCatalogInstallResponse> {
  const response: AxiosResponse<IConnectorCatalogInstallResponse> = await httpClient.post(
    `/connectors/${catalogId}/install/`,
    payload,
    { baseURL: `${getBaseUrlAuth()}/api/v1` }
  );
  return response.data;
}
