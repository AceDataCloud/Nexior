export interface ISerpConfig {
  query?: string;
  type?: 'search' | 'images' | 'news' | 'maps' | 'places' | 'videos';
  number?: number;
  page?: number;
  country?: string;
  language?: string;
  range?: string;
}

export interface ISerpSearchRequest {
  query?: string;
  type?: string;
  number?: number;
  page?: number;
  country?: string;
  language?: string;
  range?: string;
}

export interface ISerpSitelink {
  link?: string;
  title?: string;
}

export interface ISerpOrganicResult {
  link?: string;
  title?: string;
  snippet?: string;
  position?: number;
  date?: string;
  image_url?: string;
  sitelinks?: ISerpSitelink[];
  attributes?: Record<string, string>;
}

export interface ISerpImageResult {
  link?: string;
  title?: string;
  image_url?: string;
}

export interface ISerpKnowledgeGraph {
  type?: string;
  title?: string;
  image_url?: string;
  attributes?: Record<string, string>;
  description?: string;
  description_link?: string;
  description_source?: string;
}

export interface ISerpPeopleAlsoAsk {
  link?: string;
  title?: string;
  snippet?: string;
  question?: string;
}

export interface ISerpRelatedSearch {
  query?: string;
}

export interface ISerpSearchResponse {
  organic?: ISerpOrganicResult[];
  images?: ISerpImageResult[];
  knowledge_graph?: ISerpKnowledgeGraph;
  people_also_ask?: ISerpPeopleAlsoAsk[];
  related_searches?: ISerpRelatedSearch[];
}
