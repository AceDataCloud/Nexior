export interface IComment {
  id?: number;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
  publisherId?: number;
}

export interface ICommentListResponse {
  count: number;
  items: IComment[];
}

export type ICommentDetailResponse = IComment;
