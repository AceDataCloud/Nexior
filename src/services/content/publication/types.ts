export interface IPublication {
  id: number;
  name: string;
  state: string;
}

export interface IPublicationListResponse {
  count: number;
  results: IPublication[];
}

export interface IPublicationDetailResponse extends IPublication {}
