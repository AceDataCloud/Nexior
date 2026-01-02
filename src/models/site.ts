export interface ISiteFeatures {
  chatgpt?: any;
  deepseek?: any;
  grok?: any;
  gemini?: any;
  claude?: any;
  midjourney?: any;
  flux?: any;
  qrart?: any;
  luma?: any;
  pika?: any;
  kling?: any;
  veo?: any;
  sora?: any;
  pixverse?: any;
  hailuo?: any;
  headshots?: any;
  suno?: any;
  nanobanana?: any;
  seedream?: any;
  seedance?: any;
  support?: any;
}

export interface ISiteDistribution {
  default_inviter_id?: string;
  force_inviter_id?: string;
}

export interface ISiteAuth {}

export interface ISite {
  id?: string;
  origin?: string;
  title?: string;
  logo?: string;
  favicon?: string;
  keywords?: string[];
  admins?: string[];
  description?: string;
  features?: ISiteFeatures;
  distribution?: ISiteDistribution;
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
