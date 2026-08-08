import {
  IGrokVideoConfig,
  IGrokVideoGenerateRequest,
  IGrokVideoGenerateResponse,
  IGrokVideoTaskResponse,
  IGrokVideoTasksResponse
} from '@/models';
import { isGrokVideoImageOnlyModel } from '@/constants';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildGrokVideoRequest(config?: IGrokVideoConfig): IGrokVideoGenerateRequest {
  const request: IGrokVideoGenerateRequest = { ...(config || {}), async: true };
  if (typeof request.prompt === 'string') {
    request.prompt = request.prompt.trim();
    if (!request.prompt) delete request.prompt;
  }
  if (typeof request.image_url === 'string' && !request.image_url.trim()) delete request.image_url;
  if (
    isGrokVideoImageOnlyModel(request.model) ||
    !(Array.isArray(request.reference_image_urls) && request.reference_image_urls.length)
  ) {
    delete request.reference_image_urls;
  }
  return request;
}

class GrokVideoOperator extends BaseTaskOperator<
  IGrokVideoGenerateRequest,
  IGrokVideoGenerateResponse,
  IGrokVideoTaskResponse,
  IGrokVideoTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/grok/tasks', generatePath: '/grok/videos' });
  }
}

export const grokvideoOperator = new GrokVideoOperator();
