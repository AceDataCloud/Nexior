import {
  IMaestroConfig,
  IMaestroGenerateRequest,
  IMaestroGenerateResponse,
  IMaestroTaskResponse,
  IMaestroTasksResponse
} from '@/models';
import { buildMaestroGenerateRequest } from '@/utils/maestro';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildMaestroRequest(config?: IMaestroConfig): IMaestroGenerateRequest {
  return buildMaestroGenerateRequest(config);
}

class MaestroOperator extends BaseTaskOperator<
  IMaestroGenerateRequest,
  IMaestroGenerateResponse,
  IMaestroTaskResponse,
  IMaestroTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/maestro/tasks', generatePath: '/maestro/videos' });
  }
}

export const maestroOperator = new MaestroOperator();
