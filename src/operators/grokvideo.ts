import {
  IGrokVideoGenerateRequest,
  IGrokVideoGenerateResponse,
  IGrokVideoTaskResponse,
  IGrokVideoTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class GrokVideoOperator extends BaseTaskOperator<
  IGrokVideoGenerateRequest,
  IGrokVideoGenerateResponse,
  IGrokVideoTaskResponse,
  IGrokVideoTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/grok/tasks', generatePath: '/grok/videos' });
  }
}

export const grokvideoOperator = new GrokVideoOperator();
