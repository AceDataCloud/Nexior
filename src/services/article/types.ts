export interface IArticle {
  id: number;
  title: string;
  cover: string;
  summary: string;
  content: string;
  updated_at: string;
}

export interface IArticleListResponse {
  count: number;
  results: IArticle[];
}

export interface IArticleDetailResponse extends IArticle {}
