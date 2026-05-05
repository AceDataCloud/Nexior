import { ILumaGenerateRequest, ILumaGenerateResponse, ILumaTaskResponse, ILumaTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class LumaOperator extends BaseTaskOperator<
  ILumaGenerateRequest,
  ILumaGenerateResponse,
  ILumaTaskResponse,
  ILumaTasksResponse,
  ITaskListFilter
> {
  constructor() {
    super({ tasksPath: '/luma/tasks', generatePath: '/luma/videos' });
  }
}

export const lumaOperator = new LumaOperator();
