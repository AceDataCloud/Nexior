export interface IQrartConfig {
  content?: string;
  type?: string;
  prompt?: string;
  ecl?: string;
}

export interface IQrartGenerateRequest {
  content: string;
  type: string;
  prompt: string;
  ecl?: string;
  pixel_style?: string;
}

export interface IQrartGenerateResponse {
  image_url: string;
}

export interface IQrartTask {
  id: string;
  created_at?: string;
  request?: IQrartGenerateRequest;
  response?: IQrartGenerateResponse;
}

export type IQrartTaskResponse = IQrartTask;

export interface IQrartTasksResponse {
  count: number;
  items: IQrartTask[];
}
