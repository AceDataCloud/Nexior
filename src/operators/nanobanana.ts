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
    super({ tasksPath: '/nanobanana/tasks', generatePath: '/nanobanana/images' });
  }
}

export const nanobananaOperator = new NanobananaOperator();
