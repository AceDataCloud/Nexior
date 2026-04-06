import axios, { AxiosResponse } from 'axios';
import {
  IProducerAudioRequest,
  IProducerAudioResponse,
  IProducerLyricRequest,
  IProducerLyricResponse,
  IProducerTaskResponse,
  IProducerTasksResponse,
  IProducerUploadResponse,
  IProducerUploadRequest,
  IProducerVideoRequest,
  IProducerVideoResponse
} from '@/models';
import { BASE_URL_API } from '@/constants';

class ProducerOperator {
  async task(id: string, options: { token: string }): Promise<AxiosResponse<IProducerTaskResponse>> {
    return await axios.post(
      `/producer/tasks`,
      {
        action: 'retrieve',
        id: id
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`,
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
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
    options: { token: string }
  ): Promise<AxiosResponse<IProducerTasksResponse>> {
    return await axios.post(
      `/producer/tasks`,
      {
        action: 'retrieve_batch',
        ...(filter.ids
          ? {
              ids: filter.ids
            }
          : {}),
        ...(filter.userId
          ? {
              user_id: filter.userId
            }
          : {}),
        ...(filter.type
          ? {
              type: filter.type
            }
          : {}),
        ...(filter.applicationId
          ? {
              application_id: filter.applicationId
            }
          : {}),
        ...(filter.limit !== undefined
          ? {
              limit: filter.limit
            }
          : {}),
        ...(filter.offset !== undefined
          ? {
              offset: filter.offset
            }
          : {}),
        ...(filter.createdAtMax !== undefined
          ? {
              created_at_max: filter.createdAtMax
            }
          : {}),
        ...(filter.createdAtMin !== undefined
          ? {
              created_at_min: filter.createdAtMin
            }
          : {})
      },
      {
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: `Bearer ${options.token}`,
          'x-record-exempt': 'true'
        },
        baseURL: BASE_URL_API
      }
    );
  }

  async audio(
    data: IProducerAudioRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IProducerAudioResponse>> {
    return await axios.post('/producer/audios', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  async lyric(
    data: IProducerLyricRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IProducerLyricResponse>> {
    return await axios.post('/producer/lyrics', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  async upload(
    data: IProducerUploadRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IProducerUploadResponse>> {
    return await axios.post('/producer/upload', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  async video(
    data: IProducerVideoRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<IProducerVideoResponse>> {
    return await axios.post('/producer/videos', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  async wav(
    data: { audio_id: string },
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<{ data: { audio_url: string } }>> {
    return await axios.post('/producer/wav', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const producerOperator = new ProducerOperator();
