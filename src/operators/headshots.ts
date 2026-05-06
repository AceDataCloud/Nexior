import {
  IHeadshotsGenerateRequest,
  IHeadshotsGenerateResponse,
  IHeadshotsTaskResponse,
  IHeadshotsTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class HeadshotsOperator extends BaseTaskOperator<
  IHeadshotsGenerateRequest,
  IHeadshotsGenerateResponse,
  IHeadshotsTaskResponse,
  IHeadshotsTasksResponse,
  ITaskListFilter
> {
  constructor() {
    super({ tasksPath: '/headshots/tasks', generatePath: '/headshots/images' });
  }
}

export const headshotsOperator = new HeadshotsOperator();
