export type IWebextratorMode = 'render' | 'extract';

export type IWebextratorWaitUntil = 'load' | 'domcontentloaded' | 'networkidle' | 'commit';

export type IWebextratorExpectedType = 'general' | 'article' | 'product';

export type IWebextratorBlockResource = 'image' | 'font' | 'media' | 'stylesheet' | 'xhr' | 'fetch';

export interface IWebextratorConfig {
  mode?: IWebextratorMode;
  url?: string;
  wait_until?: IWebextratorWaitUntil;
  wait_for_selector?: string;
  timeout?: number;
  delay?: number;
  block_resources?: IWebextratorBlockResource[];
  user_agent?: string;
  expected_type?: IWebextratorExpectedType;
  enable_llm?: boolean;
}

export interface IWebextratorRenderRequest {
  url: string;
  wait_until?: IWebextratorWaitUntil;
  wait_for_selector?: string;
  timeout?: number;
  delay?: number;
  block_resources?: IWebextratorBlockResource[];
  user_agent?: string;
}

export interface IWebextratorExtractRequest extends IWebextratorRenderRequest {
  expected_type?: IWebextratorExpectedType;
  enable_llm?: boolean;
}

export interface IWebextratorErrorBody {
  code?: string;
  message?: string;
}

export interface IWebextratorRenderData {
  kind?: 'render';
  url?: string;
  finalUrl?: string;
  final_url?: string;
  title?: string;
  status?: number;
  html?: string;
  text?: string;
  markdown?: string;
  screenshot?: string;
  links?: string[];
  userAgent?: string;
  user_agent?: string;
  elapsedMs?: number;
  elapsed_ms?: number;
}

export interface IWebextratorExtractData {
  kind?: 'extract';
  url?: string;
  finalUrl?: string;
  final_url?: string;
  title?: string;
  description?: string;
  byline?: string;
  author?: string;
  published_at?: string;
  siteName?: string;
  site_name?: string;
  contentType?: string;
  content_type?: string;
  expected_type?: string;
  content?: string;
  summary?: string;
  markdown?: string;
  text?: string;
  html?: string;
  screenshot?: string;
  images?: string[];
  links?: string[];
  structured?: Record<string, unknown>;
}

export type IWebextratorData = IWebextratorRenderData | IWebextratorExtractData;

export interface IWebextratorResponse {
  success?: boolean;
  task_id?: string;
  trace_id?: string;
  started_at?: string;
  finished_at?: string;
  elapsed?: number;
  data?: IWebextratorData;
  error?: IWebextratorErrorBody;
}
