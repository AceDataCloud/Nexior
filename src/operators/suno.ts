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
  ISunoPersonasListResponse
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
  async style(
    data: ISunoStyleRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoStyleResponse>> {
    return await axios.post('/suno/style', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // suno/wav - get WAV format. Worker returns `data: [{ file_url }]`.
  async wav(
    data: { audio_id: string },
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<{ data: Array<{ file_url: string }> }>> {
    return await axios.post('/suno/wav', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // suno/midi - get structured MIDI note data. Worker returns
  // `data: [{ state, instruments: [{ name, notes: [{pitch,start,end,velocity}] }] }]`.
  // No URL — the caller is expected to assemble a .mid file client-side.
  async midi(
    data: { audio_id: string },
    options: {
      token: string;
    }
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
    return await axios.post('/suno/midi', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // suno/persona - create vocal persona
  async persona(
    data: ISunoPersonaRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoPersonaResponse>> {
    return await axios.post('/suno/persona', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // suno/vox - extract vocals
  async vox(
    data: ISunoVoxRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoVoxResponse>> {
    return await axios.post('/suno/vox', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // suno/timing - get timing data
  async timing(
    data: ISunoTimingRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoTimingResponse>> {
    return await axios.post('/suno/timing', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
  }

  // suno/voices - create custom voice
  async voices(
    data: ISunoVoicesRequest,
    options: {
      token: string;
    }
  ): Promise<AxiosResponse<ISunoVoicesResponse>> {
    return await axios.post('/suno/voices', data, {
      headers: {
        authorization: `Bearer ${options.token}`,
        'content-type': 'application/json'
      },
      baseURL: BASE_URL_API
    });
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
