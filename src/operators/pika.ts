import {
  IPikaConfig,
  IPikaGenerateRequest,
  IPikaGenerateResponse,
  IPikaTaskResponse,
  IPikaTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildPikaRequest(config?: IPikaConfig): IPikaGenerateRequest {
  return { ...(config || {}), async: true } as IPikaGenerateRequest;
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
