import axios, { AxiosResponse } from 'axios';
import {
  IKlingGenerateRequest,
  IKlingGenerateResponse,
  IKlingMotionRequest,
  IKlingTaskResponse,
  IKlingTasksResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class KlingOperator extends BaseTaskOperator<
  IKlingGenerateRequest,
  IKlingGenerateResponse,
  IKlingTaskResponse,
  IKlingTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/kling/tasks', generatePath: '/kling/videos' });
  }

  async motion(data: IKlingMotionRequest, options: { token: string }): Promise<AxiosResponse<IKlingGenerateResponse>> {
    return axios.post('/kling/motion', data, {
      baseURL: BASE_URL_API,
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json',
        accept: 'application/x-ndjson'
      }
    });
  }
}

export const klingOperator = new KlingOperator();
