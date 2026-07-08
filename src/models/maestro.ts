export type IMaestroAction = 'generate' | 'remix' | 'edit' | 'extend';

export interface IMaestroConfig {
  prompt?: string;
  action?: IMaestroAction;
  ref_task_id?: string;
  file_urls?: string[];
  langs?: string[];
  aspect?: string; // '9:16' | '16:9' | '1:1'
  duration?: number;
  quality?: string; // 'draft' | 'standard' | 'premium'
  scenario?: string; // 'auto' | 'narrated' | 'drama' | 'avatar' | 'motion' | 'captions'
  style?: string; // freeform visual hint (e.g. 'auto' | 'cinematic' | 'minimal' | 'neon' | 'corporate'); orthogonal to scenario
  voice?: string; // narration timbre: 'auto' (director picks) | a preset key (constants) | a 32-hex Fish reference_id
  startable?: boolean; // two-phase: estimate first, park, and only generate on Start
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

// Bottom-up cost estimate (from POST /maestro/estimates). USD is at the volume credit rate;
// `credits` is the rate-independent figure. `upper_bound` = the HIGH band (取上限).
export interface IMaestroEstimatePrice {
  low?: number;
  expected?: number;
  high?: number;
  upper_bound?: number;
  currency?: string;
  credits?: { low?: number; expected?: number; high?: number };
  credit_to_usd?: number;
  basis?: string; // 'live' | 'partial'
}

export interface IMaestroEstimateLine {
  item?: string;
  kind?: string; // 'agent' | 'api'
  unit_credits?: number;
  count?: number;
  credits?: number;
  usd?: number;
  live_price?: boolean;
  turns?: number | null;
}

export interface IMaestroEstimate {
  schema?: string;
  currency?: string;
  price?: IMaestroEstimatePrice;
  breakdown?: IMaestroEstimateLine[];
  flow?: string;
  confidence?: string; // 'high' | 'medium' | 'low'
  assumptions?: string[];
  risks?: string[];
}

export interface IMaestroData {
  variants?: IMaestroVariant[];
  project?: IMaestroProject;
  progress?: IMaestroProgress[];
  stage?: string;
  estimate?: IMaestroEstimate;
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
  status?: string; // ... | 'estimated' (parked, awaiting Start) | 'expired'
  phase?: string; // 'estimate' | 'generate' (two-phase tasks)
  startable?: boolean;
  created_at?: number;
  elapsed?: number;
  request?: IMaestroGenerateRequest;
  response?: IMaestroGenerateResponse;
  agent?: IMaestroAgentStats;
}

export type IMaestroTaskResponse = IMaestroTask;

export interface IMaestroEstimateResponse {
  success: boolean;
  estimate_id: string;
  trace_id?: string;
}

export interface IMaestroTasksResponse {
  count: number;
  items: IMaestroTask[];
}
