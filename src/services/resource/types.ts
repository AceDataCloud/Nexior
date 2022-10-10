export interface IResource {
  id: string;
  fileId?: string;
  transcodeTaskState?: string;
  uploadTaskState?: string;
  transcodeTaskId?: string;
  uploadTaskId?: string;
  watermarks?: string[];
  episode?: number;
  sign?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type IResourceDetailResponse = IResource;
