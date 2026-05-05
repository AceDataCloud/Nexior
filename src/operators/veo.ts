import { IVeoGenerateRequest, IVeoGenerateResponse, IVeoTaskResponse, IVeoTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class VeoOperator extends BaseTaskOperator<
  IVeoGenerateRequest,
  IVeoGenerateResponse,
  IVeoTaskResponse,
  IVeoTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/veo/tasks', generatePath: '/veo/videos' });
  }
}

export const veoOperator = new VeoOperator();
