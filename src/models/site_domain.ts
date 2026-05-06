/**
 * Custom (BYO) domain model — mirrors PlatformBackend's SiteDomain row.
 *
 * Each ISiteDomain represents one tenant-owned hostname (e.g.
 * "studio.mybrand.com") that has been bound to a parent ISite. Phase 1
 * uses subdomains under <subdomain_zone>; Phase 2 (this model) lets the
 * tenant CNAME their own apex/sub from a registrar they control.
 *
 * The actual TLS provisioning happens at the edge (Caddy +
 * Let's Encrypt on-demand-TLS, see Nexior `deploy/production/tenant-proxy.yaml`),
 * so the row only carries `hostname`, `status`, `proxy_cname`, and
 * audit fields. `dns_instructions` is a UI-friendly hint the backend
 * appends to the GET / verify response so the page doesn't have to
 * re-derive the CNAME copy itself.
 */

export enum SiteDomainStatus {
  Pending = 'Pending',
  Active = 'Active',
  Failed = 'Failed'
}

export interface ISiteDomainDnsInstructions {
  // Reserved for future protocol expansions; today only 'cname' is emitted.
  step: 'cname';
  record_name: string;
  record_type: 'CNAME';
  record_value: string;
  instructions: string;
}

export interface ISiteDomain {
  id?: string;
  site?: string;
  hostname?: string;
  status?: SiteDomainStatus;
  status_reason?: string | null;
  // CNAME target the tenant must point `hostname` at. Snapshotted on
  // the row when it was created so historical rows keep their original
  // instruction even if the platform default ever rotates.
  proxy_cname?: string;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  // Server-appended hint, only present on detail / verify responses
  // (and only when the row is non-Active).
  dns_instructions?: ISiteDomainDnsInstructions | null;
}

export interface ISiteDomainListResponse {
  count: number;
  items: ISiteDomain[];
}

export type ISiteDomainDetailResponse = ISiteDomain;
