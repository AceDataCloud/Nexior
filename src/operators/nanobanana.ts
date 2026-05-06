import {
  INanobananaGenerateRequest,
  INanobananaGenerateResponse,
  INanobananaTaskResponse,
  INanobananaTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class NanobananaOperator extends BaseTaskOperator<
  INanobananaGenerateRequest,
  INanobananaGenerateResponse,
  INanobananaTaskResponse,
  INanobananaTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/nano-banana/tasks', generatePath: '/nano-banana/images' });
  }
}

export const nanobananaOperator = new NanobananaOperator();
