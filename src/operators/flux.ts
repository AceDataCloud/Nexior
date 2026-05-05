import { IFluxGenerateRequest, IFluxGenerateResponse, IFluxTaskResponse, IFluxTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class FluxOperator extends BaseTaskOperator<
  IFluxGenerateRequest,
  IFluxGenerateResponse,
  IFluxTaskResponse,
  IFluxTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/flux/tasks', generatePath: '/flux/images' });
  }
}

export const fluxOperator = new FluxOperator();
