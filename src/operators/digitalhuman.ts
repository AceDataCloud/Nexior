import axios, { AxiosResponse } from 'axios';
import { BASE_URL_API, BASE_URL_X402 } from '@/constants';
import {
  IDigitalHumanConfig,
  IDigitalHumanGenerateRequest,
  IDigitalHumanGenerateResponse,
  IDigitalHumanTaskResponse,
  IDigitalHumanTasksResponse,
  IDigitalHumanVoiceRequest,
  IDigitalHumanVoiceResponse
} from '@/models';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';
import { postWithX402, quoteX402, type OperatorRequestOptions } from './x402';

const VOICE_HEADERS = { 'content-type': 'application/json', accept: 'application/json' };

export function buildDigitalHumanVideoRequest(
  config: IDigitalHumanConfig | undefined,
  faceMode: 'video' | 'photo',
  voiceMode: 'audio' | 'text'
): IDigitalHumanGenerateRequest {
  const source = config || {};
  const request: IDigitalHumanGenerateRequest = {
    video_url: faceMode === 'video' ? source.video_url : source.image_url,
    async: true
  };
  if (voiceMode === 'audio') request.audio_url = source.audio_url;
  else {
    request.text = source.text;
    request.voice_id = source.voice_id;
  }
  if (source.speed && source.speed !== 1) request.speed = source.speed;
  return request;
}

export function buildDigitalHumanVoiceRequest(data: IDigitalHumanVoiceRequest): IDigitalHumanVoiceRequest {
  return { ...data, async: true };
}

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

  async quoteVoice(data: IDigitalHumanVoiceRequest) {
    return quoteX402('/digital-human/voices', data, VOICE_HEADERS);
  }

  async cloneVoice(
    data: IDigitalHumanVoiceRequest,
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<IDigitalHumanVoiceResponse>> {
    if (options.mode === 'x402') {
      if (!options.x402) throw new Error('x402 payment options are required');
      return postWithX402<IDigitalHumanVoiceResponse>('/digital-human/voices', data, options.x402, VOICE_HEADERS);
    }
    return axios.post('/digital-human/voices', data, {
      baseURL: BASE_URL_API,
      headers: { ...VOICE_HEADERS, authorization: `Bearer ${options.token}` }
    });
  }

  async pollTask(
    taskId: string,
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<IDigitalHumanGenerateResponse>> {
    return axios.post(
      '/digital-human/tasks',
      { task_id: taskId },
      options.mode === 'x402'
        ? { baseURL: BASE_URL_X402, headers: { ...VOICE_HEADERS, 'x-record-exempt': 'true' } }
        : {
            baseURL: BASE_URL_API,
            headers: {
              ...VOICE_HEADERS,
              'x-record-exempt': 'true',
              authorization: `Bearer ${options.token}`
            }
          }
    );
  }
}

export const digitalHumanOperator = new DigitalHumanOperator();
