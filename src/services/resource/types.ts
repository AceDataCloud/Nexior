export interface IResource {
  id: string;
  url?: string;
  state?: string;
  taskId?: string;
  watermarks?: string[];
  episode?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type IResourceDetailResponse = IResource;
