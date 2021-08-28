export interface IPlatform {
  id: number;
  name: string;
  description?: string;
}

export interface IPlatformListResponse {
  count: number;
  results: IPlatform[];
}

export interface IPlatformDetailResponse extends IPlatform {}
