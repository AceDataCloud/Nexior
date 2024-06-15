export interface ISiteFeatures {}

export interface ISiteDistribution {}

export interface ISiteAuth {}

export interface ISite {
  id?: string;
  origin: string;
  title?: string;
  logo?: string;
  favicon?: string;
  keywords?: string;
  description?: string;
  features: ISiteFeatures;
  distribution: ISiteDistribution;
  auth: ISiteAuth;

  created_at?: string;
  updated_at?: string;
  metadata?: any;
  tags?: string[];
}

export interface ISiteListResponse {
  count: number;
  items: ISite[];
}

export type ISiteDetailResponse = ISite;
