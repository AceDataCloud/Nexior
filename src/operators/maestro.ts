import {
  IMaestroGenerateRequest,
  IMaestroGenerateResponse,
  IMaestroTaskResponse,
  IMaestroTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

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
