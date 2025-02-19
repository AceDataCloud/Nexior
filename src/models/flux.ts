export interface IFluxConfig {
  action?: string;
  prompt?: string;
  model?: string;
  callback_url?: string;
}

export interface IFluxGenerateRequest {
  action?: string;
  prompt?: string;
  model?: string;
  callback_url?: string;
  mirror?: boolean;
}
export interface IFluxImage {
  image_url?: string;
  timings?: number;
  prompt?: string;
  action?: string;
  seed?: number;
}
export interface IFluxGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id: string;
  data?: IFluxImage[];
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IFluxTask {
  id: string;
  created_at?: number;
  request?: IFluxGenerateRequest;
  response?: IFluxGenerateResponse;
}

export type IFluxTaskResponse = IFluxTask;

export interface IFluxTasksResponse {
  count: number;
  items: IFluxTask[];
}
