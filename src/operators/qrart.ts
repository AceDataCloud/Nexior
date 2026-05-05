import { IQrartGenerateRequest, IQrartGenerateResponse, IQrartTaskResponse, IQrartTasksResponse } from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class QrartOperator extends BaseTaskOperator<
  IQrartGenerateRequest,
  IQrartGenerateResponse,
  IQrartTaskResponse,
  IQrartTasksResponse,
  ITaskListFilter
> {
  constructor() {
    super({ tasksPath: '/qrart/tasks', generatePath: '/qrart/images' });
  }
}

export const qrartOperator = new QrartOperator();
