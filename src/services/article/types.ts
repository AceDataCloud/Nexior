export interface IArticle {
  id: number;
  title: string;
}

export interface IArticleListResponse {
  count: number;
  results: IArticle[];
}

export interface IArticleDetailResponse extends IArticle {}
