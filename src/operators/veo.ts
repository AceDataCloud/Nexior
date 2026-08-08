import { IVeoConfig, IVeoGenerateRequest, IVeoGenerateResponse, IVeoTaskResponse, IVeoTasksResponse } from '@/models';
import { buildVeoGenerateRequest } from '@/utils/veo/config';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildVeoRequest(config?: IVeoConfig): IVeoGenerateRequest {
  return buildVeoGenerateRequest(config);
}

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
