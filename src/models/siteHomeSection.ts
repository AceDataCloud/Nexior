export type SiteHomeSectionKind = 'image_text' | 'cta' | 'capability_grid' | 'rich_text';

export interface ISiteHomeSection {
  id?: string;
  site?: string;
  kind: SiteHomeSectionKind;
  title?: string | null;
  subtitle?: string | null;
  body?: string | null;
  button_label?: string | null;
  button_url?: string | null;
  image_url?: string | null;
  capability_keys?: string[];
  visible?: boolean;
  sort_order?: number;
  start_at?: string | null;
  end_at?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  title_source?: string;
  subtitle_source?: string;
  body_source?: string;
  button_label_source?: string;
  auto_translated_fields?: string[];
}

export interface ISiteHomeSectionListResponse {
  count: number;
  items: ISiteHomeSection[];
}

export type ISiteHomeSectionCreateRequest = Omit<
  ISiteHomeSection,
  | 'id'
  | 'user_id'
  | 'created_at'
  | 'updated_at'
  | 'title_source'
  | 'subtitle_source'
  | 'body_source'
  | 'button_label_source'
  | 'auto_translated_fields'
> & { site: string };

export type ISiteHomeSectionUpdateRequest = Omit<Partial<ISiteHomeSectionCreateRequest>, 'site'>;
