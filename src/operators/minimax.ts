import {
  IMinimaxConfig,
  IMinimaxGenerateRequest,
  IMinimaxGenerateResponse,
  IMinimaxTaskResponse,
  IMinimaxTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildMinimaxRequest(config?: IMinimaxConfig): IMinimaxGenerateRequest {
  return { ...(config || {}) } as IMinimaxGenerateRequest;
}

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
