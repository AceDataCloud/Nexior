import {
  IFluxConfig,
  IFluxGenerateRequest,
  IFluxGenerateResponse,
  IFluxTaskResponse,
  IFluxTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

export function buildFluxRequest(config?: IFluxConfig): IFluxGenerateRequest {
  const request: IFluxGenerateRequest = { ...(config || {}) };
  if (typeof request.prompt === 'string') request.prompt = request.prompt.trim();
  if (!request.size) delete request.size;
  if (!request.image_url) delete request.image_url;
  return { ...request, async: true };
}

class FluxOperator extends BaseTaskOperator<
  IFluxGenerateRequest,
  IFluxGenerateResponse,
  IFluxTaskResponse,
  IFluxTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/flux/tasks', generatePath: '/flux/images' });
  }
}

export const fluxOperator = new FluxOperator();
