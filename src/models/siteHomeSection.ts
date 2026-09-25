export type SiteHomeSectionKind = 'markdown' | 'html' | 'website';

export interface ISiteHomeSection {
  id?: string;
  site?: string;
  kind: SiteHomeSectionKind;
  title: string;
  body: string;
  render_in_iframe?: boolean;
  visible?: boolean;
  sort_order?: number;
  start_at?: string | null;
  end_at?: string | null;
  user_id?: string | null;
  created_at?: string;
  updated_at?: string;
  title_source?: string;
  body_source?: string;
  auto_translated_fields?: string[];
}

export interface ISiteHomeSectionListResponse {
  count: number;
  items: ISiteHomeSection[];
}

export type ISiteHomeSectionCreateRequest = Omit<
  ISiteHomeSection,
  'id' | 'user_id' | 'created_at' | 'updated_at' | 'title_source' | 'body_source' | 'auto_translated_fields'
> & { site: string };

export type ISiteHomeSectionUpdateRequest = Omit<Partial<ISiteHomeSectionCreateRequest>, 'site'>;
