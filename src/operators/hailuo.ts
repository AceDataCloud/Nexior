import {
  IHailuoConfig,
  IHailuoGenerateRequest,
  IHailuoGenerateResponse,
  IHailuoTaskResponse,
  IHailuoTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildHailuoRequest(config?: IHailuoConfig): IHailuoGenerateRequest {
  const request = { ...(config || {}), async: true } as IHailuoGenerateRequest;
  if (typeof request.prompt === 'string') request.prompt = request.prompt.trim();
  return request;
}

class HailuoOperator extends BaseTaskOperator<
  IHailuoGenerateRequest,
  IHailuoGenerateResponse,
  IHailuoTaskResponse,
  IHailuoTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/hailuo/tasks', generatePath: '/hailuo/videos' });
  }
}

export const hailuoOperator = new HailuoOperator();
