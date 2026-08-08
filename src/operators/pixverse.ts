import {
  IPixverseConfig,
  IPixverseGenerateRequest,
  IPixverseGenerateResponse,
  IPixverseTaskResponse,
  IPixverseTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildPixverseRequest(config?: IPixverseConfig): IPixverseGenerateRequest {
  return { ...(config || {}), async: true } as IPixverseGenerateRequest;
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
