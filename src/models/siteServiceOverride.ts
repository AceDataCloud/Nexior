/**
 * Per-site service presentation overrides — mirrors PlatformBackend's
 * ``SiteServiceOverride`` row. A row exists when a site admin (站长) has
 * chosen to deviate from the shared catalog Service's defaults for THIS
 * site only: hide it, rename the homepage card, or charge a different
 * per-service markup. Deleting the row reverts the site to the catalog
 * Service defaults.
 *
 * Pairs are unique on ``(site, service)``. Field semantics are kept in
 * sync with the backend serializer:
 *
 * - ``visible``       optional bool, default true.
 * - ``markup_ratio``  optional float in [0, 5] (= +0..+500%). Null falls
 *                     back to ``site.metadata.pricing.markup_ratio`` then 0.
 * - ``display_title`` optional string, trimmed, max 120 chars. Empty/null
 *                     = use catalog Service.title.
 * - ``display_summary`` optional text. Empty/null = use catalog description.
 * - ``sort_order``    integer, default 0. Lower comes first.
 */
export interface ISiteServiceOverride {
  id?: string;
  site?: string;
  service?: string;
  visible?: boolean;
  markup_ratio?: number | null;
  display_title?: string | null;
  display_summary?: string | null;
  // Read-only: raw zh-cn canonical text.
  display_title_source?: string | null;
  display_summary_source?: string | null;
  auto_translated_fields?: string[];
  sort_order?: number;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface ISiteServiceOverrideListResponse {
  count: number;
  items: ISiteServiceOverride[];
}

export type ISiteServiceOverrideDetailResponse = ISiteServiceOverride;

export interface ISiteServiceOverrideCreateRequest {
  site: string;
  service: string;
  visible?: boolean;
  markup_ratio?: number | null;
  display_title?: string | null;
  display_summary?: string | null;
  sort_order?: number;
}

// PATCH input. ``site`` / ``service`` are read-only on the backend, so
// they're deliberately omitted here.
export interface ISiteServiceOverrideUpdateRequest {
  visible?: boolean;
  markup_ratio?: number | null;
  display_title?: string | null;
  display_summary?: string | null;
  sort_order?: number;
}
