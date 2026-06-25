import {
  ISeedanceContentItem,
  ISeedanceGenerateRequest,
  ISeedanceGenerateResponse,
  ISeedanceTaskResponse,
  ISeedanceTasksResponse
} from '@/models';
import type { AxiosResponse } from 'axios';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';

class SeedanceOperator extends BaseTaskOperator<
  ISeedanceGenerateRequest,
  ISeedanceGenerateResponse,
  ISeedanceTaskResponse,
  ISeedanceTasksResponse,
  ITaskListFilter & { type?: string }
> {
  constructor() {
    super({ tasksPath: '/seedance/tasks', generatePath: '/seedance/videos' });
  }

  // Reference audio/video can only travel via the native multimodal `content[]`
  // array (the flat `images[]` path the API exposes is image-only). When the
  // request carries audio or video, fold prompt + images + audios + videos into
  // a single `content[]` and drop the flat fields; otherwise send as-is.
  async generate(
    data: ISeedanceGenerateRequest,
    options: { token: string }
  ): Promise<AxiosResponse<ISeedanceGenerateResponse>> {
    return super.generate(this.buildRequest(data), options);
  }

  private buildRequest(data: ISeedanceGenerateRequest): ISeedanceGenerateRequest {
    const audios = (data.audios ?? []).filter((a) => a?.url);
    const videos = (data.videos ?? []).filter((v) => v?.url);
    if (audios.length === 0 && videos.length === 0) {
      const { audios: _audios, videos: _videos, content: _content, ...rest } = data;
      return rest;
    }
    const content: ISeedanceContentItem[] = [];
    const prompt = (data.prompt ?? '').trim();
    if (prompt) {
      content.push({ type: 'text', text: prompt });
    }
    (data.images ?? []).forEach((image) => {
      if (image?.url) {
        content.push({ type: 'image_url', role: image.role, image_url: { url: image.url } });
      }
    });
    audios.forEach((audio) => content.push({ type: 'audio_url', audio_url: { url: audio.url } }));
    videos.forEach((video) => content.push({ type: 'video_url', video_url: { url: video.url } }));
    const { prompt: _prompt, images: _images, audios: _audios, videos: _videos, ...rest } = data;
    return { ...rest, content };
  }
}

export const seedanceOperator = new SeedanceOperator();
