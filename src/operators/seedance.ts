import {
  ISeedanceGenerateRequest,
  ISeedanceGenerateResponse,
  ISeedanceTaskResponse,
  ISeedanceTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class SeedanceOperator extends BaseTaskOperator<
  ISeedanceGenerateRequest,
  ISeedanceGenerateResponse,
  ISeedanceTaskResponse,
  ISeedanceTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/seedance/tasks', generatePath: '/seedance/videos' });
  }
}

export const seedanceOperator = new SeedanceOperator();
