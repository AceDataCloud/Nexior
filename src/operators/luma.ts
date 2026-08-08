import {
  ILumaConfig,
  ILumaGenerateRequest,
  ILumaGenerateResponse,
  ILumaTaskResponse,
  ILumaTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildLumaRequest(config?: ILumaConfig): ILumaGenerateRequest {
  return { ...(config || {}), async: true } as ILumaGenerateRequest;
}

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
