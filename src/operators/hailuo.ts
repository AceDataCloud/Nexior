import { IHailuoGenerateRequest, IHailuoGenerateResponse, IHailuoTaskResponse, IHailuoTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

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
