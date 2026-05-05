import { IWanGenerateRequest, IWanGenerateResponse, IWanTaskResponse, IWanTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

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
