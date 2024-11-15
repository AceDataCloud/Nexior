export interface Picture {
  id?: string;
  audio_url?: string;
  created_at?: string;
}
// Submitted payload
export interface IHeadshotsConfig {
  mode?: string;
  template?: string;
  image_urls?: string[];
}
export interface IHeadshotsGenerateRequest {
  mode?: string;
  template?: string;
  image_urls?: string[];
}

export interface IHeadshotsPicture {
  id?: string;
  image_url?: string;
  template?: number;
}

export interface IHeadshotsGenerateResponse {
  success?: boolean;
  status?: string;
  task_id: string;
  trace_id: string;
  error?: {
    code?: string;
    message?: string;
  };
  data?: IHeadshotsPicture[];
}

export interface IHeadshotsTask {
  map(arg0: (song: any) => any): any;
  id: string;
  _id: string;
  api_id?: string;
  application_id?: string;
  created_at?: string;
  credential_id?: string;
  trace_id?: string;
  user_id?: string;
  request?: IHeadshotsGenerateRequest;
  response?: IHeadshotsGenerateResponse;
}

export type IHeadshotsTaskResponse = IHeadshotsTask;

export interface IHeadshotsTasksResponse {
  count: number;
  items: IHeadshotsTask[];
}
