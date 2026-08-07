import {
  IMinimaxGenerateRequest,
  IMinimaxGenerateResponse,
  IMinimaxTaskResponse,
  IMinimaxTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class MinimaxOperator extends BaseTaskOperator<
  IMinimaxGenerateRequest,
  IMinimaxGenerateResponse,
  IMinimaxTaskResponse,
  IMinimaxTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/minimax/tasks', generatePath: '/minimax/videos' });
  }
}

export const minimaxOperator = new MinimaxOperator();
