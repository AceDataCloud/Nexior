import axios, { AxiosResponse } from 'axios';
import {
  ISunoAudioRequest,
  ISunoAudioResponse,
  ISunoLyricRequest,
  ISunoLyricResponse,
  ISunoTaskResponse,
  ISunoTasksResponse,
  ISunoUploadResponse,
  ISunoUploadRequest
} from '@/models';
import { BASE_URL_API } from '@/constants';

class SunoOperator {
  async task(id: string, options: { token: string }): Promise<AxiosResponse<ISunoTaskResponse>> {
    return await axios.post(
      `/suno/tasks`,
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
  ): Promise<AxiosResponse<ISunoTasksResponse>> {
    return await axios.post(
      `/suno/tasks`,
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
  // 生成歌曲
  async audio(
    data: ISunoAudioRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoAudioResponse>> {
    return await axios.post('/suno/audios', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }
  // 生成歌曲歌词
  async lyric(
    data: ISunoLyricRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoLyricResponse>> {
    return await axios.post('/suno/lyrics', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // suno/upload
  async upload(
    data: ISunoUploadRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoUploadResponse>> {
    return await axios.post('/suno/upload', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const sunoOperator = new SunoOperator();
