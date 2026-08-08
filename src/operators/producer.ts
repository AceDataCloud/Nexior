import axios, { AxiosResponse } from 'axios';
import {
  IProducerAudioRequest,
  IProducerAudioResponse,
  IProducerConfig,
  IProducerLyricRequest,
  IProducerLyricResponse,
  IProducerTaskResponse,
  IProducerTasksResponse,
  IProducerUploadRequest,
  IProducerUploadResponse,
  IProducerVideoRequest,
  IProducerVideoResponse
} from '@/models';
import { BASE_URL_API, BASE_URL_X402 } from '@/constants';
import { postWithX402, quoteX402, type OperatorRequestOptions } from './x402';

const HEADERS = { 'content-type': 'application/json', accept: 'application/json' };
const TASK_HEADERS = { ...HEADERS, 'x-record-exempt': 'true' };

export function buildProducerAudioRequest(config?: IProducerConfig): IProducerAudioRequest {
  return { ...(config || {}), audio: undefined, async: true } as IProducerAudioRequest;
}

class ProducerOperator {
  async task(id: string, options: OperatorRequestOptions): Promise<AxiosResponse<IProducerTaskResponse>> {
    return axios.post(
      '/producer/tasks',
      { action: 'retrieve', id },
      options.mode === 'x402'
        ? { headers: TASK_HEADERS, baseURL: BASE_URL_X402 }
        : { headers: { ...TASK_HEADERS, authorization: `Bearer ${options.token}` }, baseURL: BASE_URL_API }
    );
  }

  async tasks(
    filter: {
      ids?: string[];
      applicationId?: string;
      userId?: string;
      type?: string;
      limit?: number;
      offset?: number;
      createdAtMax?: number;
      createdAtMin?: number;
    },
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<IProducerTasksResponse>> {
    return axios.post(
      '/producer/tasks',
      {
        action: 'retrieve_batch',
        ...(filter.ids ? { ids: filter.ids } : {}),
        ...(filter.userId ? { user_id: filter.userId } : {}),
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.applicationId ? { application_id: filter.applicationId } : {}),
        ...(filter.limit !== undefined ? { limit: filter.limit } : {}),
        ...(filter.offset !== undefined ? { offset: filter.offset } : {}),
        ...(filter.createdAtMax !== undefined ? { created_at_max: filter.createdAtMax } : {}),
        ...(filter.createdAtMin !== undefined ? { created_at_min: filter.createdAtMin } : {})
      },
      options.mode === 'x402'
        ? { headers: TASK_HEADERS, baseURL: BASE_URL_X402 }
        : { headers: { ...TASK_HEADERS, authorization: `Bearer ${options.token}` }, baseURL: BASE_URL_API }
    );
  }

  async quoteAudio(data: IProducerAudioRequest) {
    return quoteX402('/producer/audios', data, HEADERS);
  }
  async quoteLyric(data: IProducerLyricRequest) {
    return quoteX402('/producer/lyrics', data, HEADERS);
  }
  async quoteWav(data: { audio_id: string }) {
    return quoteX402('/producer/wav', data, HEADERS);
  }
  async quoteVideo(data: IProducerVideoRequest) {
    return quoteX402('/producer/videos', data, HEADERS);
  }

  private async submit<T>(path: string, data: unknown, options: OperatorRequestOptions): Promise<AxiosResponse<T>> {
    if (options.mode === 'x402') {
      if (!options.x402) throw new Error('x402 payment options are required');
      return postWithX402<T>(path, data, options.x402, HEADERS);
    }
    return axios.post(path, data, {
      headers: { ...HEADERS, authorization: `Bearer ${options.token}` },
      baseURL: BASE_URL_API
    });
  }

  async audio(data: IProducerAudioRequest, options: OperatorRequestOptions) {
    return this.submit<IProducerAudioResponse>('/producer/audios', data, options);
  }
  async lyric(data: IProducerLyricRequest, options: OperatorRequestOptions) {
    return this.submit<IProducerLyricResponse>('/producer/lyrics', data, options);
  }
  async wav(data: { audio_id: string }, options: OperatorRequestOptions) {
    return this.submit<{ data: Array<{ file_url?: string }> | { file_url?: string; audio_url?: string } }>(
      '/producer/wav',
      data,
      options
    );
  }

  async upload(
    data: IProducerUploadRequest,
    options: { token: string }
  ): Promise<AxiosResponse<IProducerUploadResponse>> {
    return axios.post('/producer/upload', data, {
      headers: { ...HEADERS, authorization: `Bearer ${options.token}` },
      baseURL: BASE_URL_API
    });
  }

  async video(data: IProducerVideoRequest, options: OperatorRequestOptions) {
    return this.submit<IProducerVideoResponse>('/producer/videos', data, options);
  }
}

export const producerOperator = new ProducerOperator();
