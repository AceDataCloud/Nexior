export interface IEpisode {
  id: number;
  tags?: string[];
  title?: string;
  cover?: string;
  thumbnail?: string;
  duration?: number;
  introduction?: string;
  state?: 'Pending' | 'Running' | 'Ready';
  type?: 'Video' | 'Document';
  isFree?: boolean;
  index?: number;
  viewCount?: number;
  resourceUrl?: string;
  createdAt?: string;
  updatedAt?: string;
  publisherId?: number;
}

export interface IEpisodeListResponse {
  count: number;
  items: IEpisode[];
}

export interface IEpisodeSignResponse {
  sign: string;
}

export type IEpisodeDetailResponse = IEpisode;
