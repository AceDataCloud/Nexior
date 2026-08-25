import {
  ISoraConfig,
  ISoraGenerateRequest,
  ISoraGenerateResponse,
  ISoraTaskResponse,
  ISoraTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildSoraRequest(config?: ISoraConfig): ISoraGenerateRequest {
  const request = { ...(config || {}), async: true } as ISoraGenerateRequest;
  if (typeof request.prompt === 'string') request.prompt = request.prompt.trim();
  return request;
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
