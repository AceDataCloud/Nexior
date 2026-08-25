import {
  IPixverseConfig,
  IPixverseGenerateRequest,
  IPixverseGenerateResponse,
  IPixverseTaskResponse,
  IPixverseTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildPixverseRequest(config?: IPixverseConfig): IPixverseGenerateRequest {
  const request = { ...(config || {}), async: true } as IPixverseGenerateRequest;
  if (typeof request.prompt === 'string') request.prompt = request.prompt.trim();
  return request;
}

class PixverseOperator extends BaseTaskOperator<
  IPixverseGenerateRequest,
  IPixverseGenerateResponse,
  IPixverseTaskResponse,
  IPixverseTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/pixverse/tasks', generatePath: '/pixverse/videos' });
  }
}

export const pixverseOperator = new PixverseOperator();
