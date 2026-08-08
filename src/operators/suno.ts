import axios, { AxiosResponse } from 'axios';
import {
  ISunoAudioRequest,
  ISunoAudioResponse,
  ISunoLyricRequest,
  ISunoLyricResponse,
  ISunoTaskResponse,
  ISunoTasksResponse,
  ISunoUploadResponse,
  ISunoUploadRequest,
  ISunoMp4Request,
  ISunoMp4Response,
  ISunoStyleRequest,
  ISunoStyleResponse,
  ISunoPersonaRequest,
  ISunoPersonaResponse,
  ISunoVoxRequest,
  ISunoVoxResponse,
  ISunoTimingRequest,
  ISunoTimingResponse,
  ISunoVoicesRequest,
  ISunoVoicesResponse,
  ISunoMashupLyricsRequest,
  ISunoMashupLyricsResponse,
  ISunoPersonasListResponse,
  ISunoConfig
} from '@/models';
import { BASE_URL_API, BASE_URL_X402 } from '@/constants';
import { postWithX402, quoteX402, type OperatorRequestOptions } from './x402';

const HEADERS = { 'content-type': 'application/json', accept: 'application/json' };
const TASK_HEADERS = { ...HEADERS, 'x-record-exempt': 'true' };

export function buildSunoAudioRequest(config?: ISunoConfig): ISunoAudioRequest {
  const request = { ...(config || {}), audio: undefined, async: true } as ISunoAudioRequest;
  if (typeof request.prompt === 'string') request.prompt = request.prompt.trim();
  return request;
}

class SunoOperator {
  async task(id: string, options: OperatorRequestOptions): Promise<AxiosResponse<ISunoTaskResponse>> {
    return await axios.post(
      `/suno/tasks`,
      {
        action: 'retrieve',
        id: id
      },
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
      options.mode === 'x402'
        ? { headers: TASK_HEADERS, baseURL: BASE_URL_X402 }
        : { headers: { ...TASK_HEADERS, authorization: `Bearer ${options.token}` }, baseURL: BASE_URL_API }
    );
  }
  async quoteAudio(data: ISunoAudioRequest) {
    return quoteX402('/suno/audios', data, HEADERS);
  }

  private async submitExact<T>(
    path: string,
    data: unknown,
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<T>> {
    if (options.mode === 'x402') {
      if (!options.x402) throw new Error('x402 payment options are required');
      return postWithX402<T>(path, data, options.x402, HEADERS);
    }
    return axios.post(path, data, {
      headers: { ...HEADERS, authorization: `Bearer ${options.token}` },
      baseURL: BASE_URL_API
    });
  }

  // 生成歌曲
  async audio(data: ISunoAudioRequest, options: OperatorRequestOptions): Promise<AxiosResponse<ISunoAudioResponse>> {
    return this.submitExact<ISunoAudioResponse>('/suno/audios', data, options);
  }

  // 生成歌曲歌词
  async lyric(data: ISunoLyricRequest, options: OperatorRequestOptions): Promise<AxiosResponse<ISunoLyricResponse>> {
    return this.submitExact<ISunoLyricResponse>('/suno/lyrics', data, options);
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

  // suno/mp4
  async mp4(
    data: ISunoMp4Request,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoMp4Response>> {
    return await axios.post('/suno/mp4', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // suno/style - optimize style description
  async style(data: ISunoStyleRequest, options: OperatorRequestOptions): Promise<AxiosResponse<ISunoStyleResponse>> {
    return this.submitExact<ISunoStyleResponse>('/suno/style', data, options);
  }

  // suno/wav - get WAV format. Worker returns `data: [{ file_url }]`.
  async wav(
    data: { audio_id: string },
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<{ data: Array<{ file_url: string }> }>> {
    return this.submitExact<{ data: Array<{ file_url: string }> }>('/suno/wav', data, options);
  }

  // suno/midi - get structured MIDI note data. Worker returns
  // `data: [{ state, instruments: [{ name, notes: [{pitch,start,end,velocity}] }] }]`.
  // No URL — the caller is expected to assemble a .mid file client-side.
  async midi(
    data: { audio_id: string },
    options: OperatorRequestOptions
  ): Promise<
    AxiosResponse<{
      data: Array<{
        state?: string;
        instruments: Array<{
          name?: string;
          notes: Array<{ pitch: number; start: number; end: number; velocity: number }>;
        }>;
      }>;
    }>
  > {
    return this.submitExact<{
      data: Array<{
        state?: string;
        instruments: Array<{
          name?: string;
          notes: Array<{ pitch: number; start: number; end: number; velocity: number }>;
        }>;
      }>;
    }>('/suno/midi', data, options);
  }

  // suno/persona - create vocal persona
  async persona(
    data: ISunoPersonaRequest,
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<ISunoPersonaResponse>> {
    return this.submitExact<ISunoPersonaResponse>('/suno/persona', data, options);
  }

  // suno/vox - extract vocals
  async vox(data: ISunoVoxRequest, options: OperatorRequestOptions): Promise<AxiosResponse<ISunoVoxResponse>> {
    return this.submitExact<ISunoVoxResponse>('/suno/vox', data, options);
  }

  // suno/timing - get timing data
  async timing(data: ISunoTimingRequest, options: OperatorRequestOptions): Promise<AxiosResponse<ISunoTimingResponse>> {
    return this.submitExact<ISunoTimingResponse>('/suno/timing', data, options);
  }

  // suno/voices - create custom voice
  async voices(data: ISunoVoicesRequest, options: OperatorRequestOptions): Promise<AxiosResponse<ISunoVoicesResponse>> {
    return this.submitExact<ISunoVoicesResponse>('/suno/voices', data, options);
  }

  // suno/mashup-lyrics - generate mashup lyrics
  async mashupLyrics(
    data: ISunoMashupLyricsRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoMashupLyricsResponse>> {
    return await axios.post('/suno/mashup-lyrics', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // GET /suno/persona - list user personas
  async personasList(
    data: { user_id: string; limit?: number; offset?: number },
    options: { token: string }
  ): Promise<AxiosResponse<ISunoPersonasListResponse>> {
    return await axios.get('/suno/persona', {
      params: data,
      headers: {
        authorization: `Bearer ${options.token}`,
        'x-record-exempt': 'true'
      },
      baseURL: BASE_URL_API
    });
  }

  // DELETE /suno/persona - delete a persona
  async personasDelete(
    data: { persona_id: string; user_id?: string },
    options: { token: string }
  ): Promise<AxiosResponse<{ success: boolean }>> {
    return await axios.delete('/suno/persona', {
      params: data,
      headers: {
        authorization: `Bearer ${options.token}`,
        'x-record-exempt': 'true'
      },
      baseURL: BASE_URL_API
    });
  }
}

export const sunoOperator = new SunoOperator();
