export interface ISiteCapabilityOverride {
  id?: string;
  site?: string;
  capability?: string;
  display_name?: string | null;
  display_name_source?: string | null;
  icon_url?: string | null;
  auto_translated_fields?: string[];
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ISiteCapabilityOverrideListResponse {
  count: number;
  items: ISiteCapabilityOverride[];
}

export type ISiteCapabilityOverrideDetailResponse = ISiteCapabilityOverride;

export interface ISiteCapabilityOverrideCreateRequest {
  site: string;
  capability: string;
  display_name?: string | null;
  icon_url?: string | null;
}

export interface ISiteCapabilityOverrideUpdateRequest {
  display_name?: string | null;
  icon_url?: string | null;
}
