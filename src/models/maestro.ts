export interface IMaestroConfig {
  source_type?: string; // 'Topic' | 'Article'
  source_ref?: string;
  lang?: string;
  extra_langs?: string[];
  aspect?: string; // '9:16' | '16:9' | '1:1'
  duration?: number;
  music?: boolean;
  callback_url?: string;
}

export interface IMaestroGenerateRequest extends IMaestroConfig {
  async?: boolean;
}

export interface IMaestroVariant {
  variant?: string;
  lang?: string;
  aspect?: string;
  output_url?: string;
  captions_url?: string;
  duration?: number;
  qc_score?: number | null;
  state?: string;
}

export interface IMaestroStoryboard {
  title?: string;
  hook?: string;
  scenes?: unknown[];
}

export interface IMaestroData {
  variants?: IMaestroVariant[];
  storyboard?: IMaestroStoryboard;
}

export interface IMaestroGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IMaestroData;
  error?: {
    code?: string;
    message?: string;
  };
}

export interface IMaestroTask {
  id: string;
  status?: string;
  created_at?: number;
  elapsed?: number;
  request?: IMaestroGenerateRequest;
  response?: IMaestroGenerateResponse;
}

export type IMaestroTaskResponse = IMaestroTask;

export interface IMaestroTasksResponse {
  count: number;
  items: IMaestroTask[];
}
