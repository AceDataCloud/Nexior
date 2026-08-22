export type ISiteBannerI18nMap = Record<string, string> | null;

export interface ISiteBanner {
  id?: string;
  site?: string;
  image_url?: string | null;
  link_url?: string | null;
  title?: ISiteBannerI18nMap;
  subtitle?: ISiteBannerI18nMap;
  title_source?: string;
  subtitle_source?: string;
  auto_translated_fields?: string[];
  visible?: boolean;
  sort_order?: number;
  start_at?: string | null;
  end_at?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

export interface ISiteBannerListResponse {
  count: number;
  items: ISiteBanner[];
}

export type ISiteBannerDetailResponse = ISiteBanner;

export interface ISiteBannerCreateRequest {
  site: string;
  image_url?: string | null;
  link_url?: string | null;
  title?: ISiteBannerI18nMap;
  subtitle?: ISiteBannerI18nMap;
  visible?: boolean;
  sort_order?: number;
  start_at?: string | null;
  end_at?: string | null;
}

export type ISiteBannerUpdateRequest = Omit<Partial<ISiteBannerCreateRequest>, 'site'>;
