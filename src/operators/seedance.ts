import {
  ISeedanceContentItem,
  ISeedanceGenerateRequest,
  ISeedanceGenerateResponse,
  ISeedanceTaskResponse,
  ISeedanceTasksResponse
} from '@/models';
import type { AxiosResponse } from 'axios';
import { BaseTaskOperator, ITaskListFilter } from './baseTaskOperator';
import type { OperatorRequestOptions } from './x402';

export function buildSeedanceRequest(data: ISeedanceGenerateRequest): ISeedanceGenerateRequest {
  const audios = (data.audios ?? []).filter((audio) => audio?.url);
  const videos = (data.videos ?? []).filter((video) => video?.url);
  if (audios.length === 0 && videos.length === 0) {
    const { audios: _audios, videos: _videos, content: _content, ...rest } = data;
    return rest;
  }
  const content: ISeedanceContentItem[] = [];
  const prompt = (data.prompt ?? '').trim();
  if (prompt) content.push({ type: 'text', text: prompt });
  (data.images ?? []).forEach((image) => {
    if (image?.url) content.push({ type: 'image_url', role: image.role, image_url: { url: image.url } });
  });
  audios.forEach((audio) => content.push({ type: 'audio_url', audio_url: { url: audio.url } }));
  videos.forEach((video) => content.push({ type: 'video_url', video_url: { url: video.url } }));
  const { prompt: _prompt, images: _images, audios: _audios, videos: _videos, ...rest } = data;
  return { ...rest, content };
}

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

  async quote(data: ISeedanceGenerateRequest) {
    return super.quote(buildSeedanceRequest(data));
  }

  async generate(
    data: ISeedanceGenerateRequest,
    options: OperatorRequestOptions
  ): Promise<AxiosResponse<ISeedanceGenerateResponse>> {
    return super.generate(buildSeedanceRequest(data), options);
  }
}

export const seedanceOperator = new SeedanceOperator();
