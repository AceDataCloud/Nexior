import { ISoraGenerateRequest, ISoraGenerateResponse, ISoraTaskResponse, ISoraTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class SoraOperator extends BaseTaskOperator<
  ISoraGenerateRequest,
  ISoraGenerateResponse,
  ISoraTaskResponse,
  ISoraTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/sora/tasks', generatePath: '/sora/videos' });
  }
}

export const soraOperator = new SoraOperator();
