import { IOmniGenerateRequest, IOmniGenerateResponse, IOmniTaskResponse, IOmniTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class OmniOperator extends BaseTaskOperator<
  IOmniGenerateRequest,
  IOmniGenerateResponse,
  IOmniTaskResponse,
  IOmniTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/gemini/tasks', generatePath: '/gemini/videos' });
  }
}

export const omniOperator = new OmniOperator();
