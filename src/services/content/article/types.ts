export interface IArticle {
  id?: number;
  title?: string | undefined;
  cover?: string | undefined;
  summary?: string | undefined;
  content?: string | undefined;
  updated_at?: string | undefined;
}

export interface IArticleListResponse {
  count: number;
  results: IArticle[];
}

export interface IArticleDetailResponse extends IArticle {}
