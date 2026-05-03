/**
 * Custom (BYO) domain model — mirrors PlatformBackend's SiteDomain row.
 *
 * Each ISiteDomain represents one tenant-owned hostname (e.g.
 * "studio.mybrand.com") that has been bound to a parent ISite. Phase 1
 * uses subdomains under <subdomain_zone>; Phase 2 (this model) lets the
 * tenant CNAME their own apex/sub from a registrar they control.
 *
 * The `status` field walks a small DAG; see `SiteDomainStatus` below.
 * `dns_instructions` is a UI-friendly hint the backend appends to the
 * GET / verify response so the page doesn't have to re-derive the TXT
 * or CNAME copy itself.
 */

export enum SiteDomainStatus {
  PendingDnsVerification = 'PendingDnsVerification',
  ProvisioningEo = 'ProvisioningEo',
  ProvisioningCert = 'ProvisioningCert',
  Active = 'Active',
  Failed = 'Failed'
}

export interface ISiteDomainDnsInstructions {
  step: 'txt' | 'cname';
  record_name: string;
  record_type: 'TXT' | 'CNAME';
  record_value: string;
  instructions: string;
}

export interface ISiteDomain {
  id?: string;
  site?: string;
  hostname?: string;
  status?: SiteDomainStatus;
  status_reason?: string | null;
  verification_token?: string;
  eo_zone_id?: string | null;
  eo_cname?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  last_synced_at?: string | null;
  tags?: string[];
  metadata?: Record<string, unknown> | null;
  // Server-appended hint, only present on detail / verify responses.
  dns_instructions?: ISiteDomainDnsInstructions | null;
}

export interface ISiteDomainListResponse {
  count: number;
  items: ISiteDomain[];
}

export type ISiteDomainDetailResponse = ISiteDomain;
