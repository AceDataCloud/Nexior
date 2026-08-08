import {
  IOmniConfig,
  IOmniGenerateRequest,
  IOmniGenerateResponse,
  IOmniTaskResponse,
  IOmniTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildOmniRequest(config?: IOmniConfig): IOmniGenerateRequest {
  const request: IOmniGenerateRequest = { ...(config || {}), async: true };
  if (typeof request.prompt === 'string') {
    request.prompt = request.prompt.trim();
    if (!request.prompt) delete request.prompt;
  }
  if (Array.isArray(request.image_urls)) {
    request.image_urls = request.image_urls.filter((url) => typeof url === 'string' && url.trim());
    if (!request.image_urls.length) delete request.image_urls;
  }
  if (Array.isArray(request.video_urls)) {
    request.video_urls = request.video_urls.filter((url) => typeof url === 'string' && url.trim());
    if (!request.video_urls.length) delete request.video_urls;
  }
  return request;
}

class OmniOperator extends BaseTaskOperator<
  IOmniGenerateRequest,
  IOmniGenerateResponse,
  IOmniTaskResponse,
  IOmniTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/gemini/tasks', generatePath: '/gemini/videos' });
  }
}

export const omniOperator = new OmniOperator();
