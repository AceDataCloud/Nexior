export type IMaestroAction = 'generate' | 'remix' | 'edit' | 'extend';

export interface IMaestroConfig {
  prompt?: string;
  action?: IMaestroAction;
  ref_task_id?: string;
  file_urls?: string[];
  langs?: string[];
  aspect?: string; // '9:16' | '16:9' | '1:1'
  duration?: number;
  callback_url?: string;
}

export type IMaestroGenerateRequest = IMaestroConfig;

export interface IMaestroVariant {
  lang?: string;
  aspect?: string;
  kind?: string; // 'video'
  title?: string;
  output_url?: string;
}

export interface IMaestroProgress {
  stage?: string;
  message?: string;
  pct?: number | null;
  t?: number;
}

export interface IMaestroProject {
  cos_prefix?: string;
  tarball_url?: string;
  outputs?: string[];
}

export interface IMaestroData {
  variants?: IMaestroVariant[];
  project?: IMaestroProject;
  progress?: IMaestroProgress[];
  stage?: string;
}

export interface IMaestroGenerateResponse {
  success: boolean;
  task_id: string;
  trace_id?: string;
  data?: IMaestroData;
  // The worker sets a plain string on failure; objects are also tolerated.
  error?: string | { code?: string; message?: string };
}

export interface IMaestroAgentStats {
  model?: string;
  cost_usd?: number;
  turns?: number;
  tool_calls?: number;
}

export interface IMaestroTask {
  id: string;
  status?: string;
  created_at?: number;
  elapsed?: number;
  request?: IMaestroGenerateRequest;
  response?: IMaestroGenerateResponse;
  agent?: IMaestroAgentStats;
}

export type IMaestroTaskResponse = IMaestroTask;

export interface IMaestroTasksResponse {
  count: number;
  items: IMaestroTask[];
}
