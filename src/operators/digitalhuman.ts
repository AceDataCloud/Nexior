import axios, { AxiosResponse } from 'axios';
import { BASE_URL_API } from '@/constants';
import {
  IDigitalHumanGenerateRequest,
  IDigitalHumanGenerateResponse,
  IDigitalHumanTaskResponse,
  IDigitalHumanTasksResponse,
  IDigitalHumanVoiceRequest,
  IDigitalHumanVoiceResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class DigitalHumanOperator extends BaseTaskOperator<
  IDigitalHumanGenerateRequest,
  IDigitalHumanGenerateResponse,
  IDigitalHumanTaskResponse,
  IDigitalHumanTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/digital-human/tasks', generatePath: '/digital-human/videos' });
  }

  /** Clone a voice sample into a reusable voice_id (async — poll with `pollTask`). */
  async cloneVoice(
    data: IDigitalHumanVoiceRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IDigitalHumanVoiceResponse>> {
    return axios.post('/digital-human/voices', data, {
      baseURL: BASE_URL_API,
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: `Bearer ${options.token}`
      }
    });
  }

  /** Poll a single task (voice clone or video) by task_id — the flat external shape. */
  async pollTask(taskId: string, options: { token: string }): Promise<AxiosResponse<IDigitalHumanGenerateResponse>> {
    return axios.post(
      '/digital-human/tasks',
      { task_id: taskId },
      {
        baseURL: BASE_URL_API,
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          'x-record-exempt': 'true',
          authorization: `Bearer ${options.token}`
        }
      }
    );
  }
}

export const digitalHumanOperator = new DigitalHumanOperator();
