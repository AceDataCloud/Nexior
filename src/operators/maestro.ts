import axios, { AxiosResponse } from 'axios';
import { BASE_URL_API } from '@/constants';
import {
  IMaestroConfig,
  IMaestroEstimateResponse,
  IMaestroGenerateRequest,
  IMaestroGenerateResponse,
  IMaestroTaskResponse,
  IMaestroTasksResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class MaestroOperator extends BaseTaskOperator<
  IMaestroGenerateRequest,
  IMaestroGenerateResponse,
  IMaestroTaskResponse,
  IMaestroTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/maestro/tasks', generatePath: '/maestro/videos' });
  }

  /**
   * Two-phase estimate: create a cost estimate that PARKS awaiting Start (startable=true).
   * Free (never billed) and routed through /maestro/estimates so a low-balance user can still
   * get a quote. Returns { estimate_id } — the task appears in the task list at status
   * `estimated` with the cost, then `start()` launches the real generation.
   */
  async estimate(config: IMaestroConfig, options: { token: string }): Promise<AxiosResponse<IMaestroEstimateResponse>> {
    return axios.post(
      '/maestro/estimates',
      { ...config, startable: true },
      {
        baseURL: BASE_URL_API,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`
        }
      }
    );
  }

  /** Launch a parked `estimated` task's generation phase (the "Start" button). */
  async start(id: string, options: { token: string }): Promise<AxiosResponse<IMaestroTaskResponse>> {
    return axios.post(
      this.tasksPath,
      { action: 'start', id },
      {
        baseURL: BASE_URL_API,
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`
        }
      }
    );
  }
}

export const maestroOperator = new MaestroOperator();
