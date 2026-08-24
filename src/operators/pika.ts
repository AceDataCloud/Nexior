import {
  IPikaConfig,
  IPikaGenerateRequest,
  IPikaGenerateResponse,
  IPikaTaskResponse,
  IPikaTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildPikaRequest(config?: IPikaConfig): IPikaGenerateRequest {
  const request = { ...(config || {}), async: true } as IPikaGenerateRequest;
  if (typeof request.prompt === 'string') request.prompt = request.prompt.trim();
  return request;
}

class PikaOperator extends BaseTaskOperator<
  IPikaGenerateRequest,
  IPikaGenerateResponse,
  IPikaTaskResponse,
  IPikaTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/pika/tasks', generatePath: '/pika/videos' });
  }
}

export const pikaOperator = new PikaOperator();
