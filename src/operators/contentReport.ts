import { AxiosResponse } from 'axios';
import { httpClient } from './common';

export type IContentReportReason =
  | 'sexual'
  | 'violence'
  | 'hate'
  | 'child_safety'
  | 'self_harm'
  | 'deception'
  | 'illegal'
  | 'ip'
  | 'other';

export interface IContentReportRequest {
  // Capability that produced the content, e.g. 'openaiimage', 'chat'.
  service?: string;
  // Task id, or message id for chat.
  target_id?: string;
  reason: IContentReportReason;
  detail?: string;
  // Prompt / result excerpt, frozen server-side so a moderator can still see
  // the content after the user deletes the task.
  snapshot?: Record<string, unknown>;
}

export interface IContentReportResponse {
  id: string;
}

class ContentReportOperator {
  async create(payload: IContentReportRequest): Promise<AxiosResponse<IContentReportResponse>> {
    return httpClient.post('/content-reports/', payload);
  }
}

export const contentReportOperator = new ContentReportOperator();
