import { IWanConfig, IWanGenerateRequest, IWanGenerateResponse, IWanTaskResponse, IWanTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildWanRequest(config?: IWanConfig): IWanGenerateRequest {
  const request = { ...(config || {}), async: true } as IWanGenerateRequest & { media_text?: string };
  if (request.model === 'wan3.0-video') {
    request.media = (request.media_text || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const index = line.indexOf('=');
        return { type: index > 0 ? line.slice(0, index) : '', url: index > 0 ? line.slice(index + 1) : line };
      })
      .filter((item) => item.type && item.url);
    delete request.action;
    delete request.image_url;
  }
  delete request.media_text;
  return request;
}

class WanOperator extends BaseTaskOperator<
  IWanGenerateRequest,
  IWanGenerateResponse,
  IWanTaskResponse,
  IWanTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/wan/tasks', generatePath: '/wan/videos' });
  }
}

export const wanOperator = new WanOperator();
