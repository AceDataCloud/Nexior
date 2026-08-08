import {
  ISoraConfig,
  ISoraGenerateRequest,
  ISoraGenerateResponse,
  ISoraTaskResponse,
  ISoraTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildSoraRequest(config?: ISoraConfig): ISoraGenerateRequest {
  return { ...(config || {}), async: true } as ISoraGenerateRequest;
}

class SoraOperator extends BaseTaskOperator<
  ISoraGenerateRequest,
  ISoraGenerateResponse,
  ISoraTaskResponse,
  ISoraTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/sora/tasks', generatePath: '/sora/videos' });
  }
}

export const soraOperator = new SoraOperator();
