import axios, { AxiosResponse } from 'axios';
import {
  IMidjourneyConfig,
  IMidjourneyDescribeRequest,
  IMidjourneyDescribeResponse,
  IMidjourneyImagineRequest,
  IMidjourneyImagineResponse,
  IMidjourneyTaskResponse,
  IMidjourneyTasksResponse,
  IMidjourneyVideosRequest,
  IMidjourneyVideosResponse,
  MidjourneyImagineAction,
  MidjourneyVideosAction
} from '@/models';
import {
  BASE_URL_API,
  BASE_URL_X402,
  MIDJOURNEY_DEFAULT_IMAGE_WEIGHT,
  MIDJOURNEY_DEFAULT_MODE,
  MIDJOURNEY_DEFAULT_QUALITY,
  MIDJOURNEY_DEFAULT_RATIO,
  MIDJOURNEY_DEFAULT_STYLIZE,
  MIDJOURNEY_DEFAULT_WIRED
} from '@/constants';
import { postWithX402, quoteX402, type OperatorRequestOptions } from './x402';

const HEADERS = { 'content-type': 'application/json', accept: 'application/x-ndjson' };
const TASK_HEADERS = { 'content-type': 'application/json', accept: 'application/json', 'x-record-exempt': 'true' };

function buildFinalPrompt(config: IMidjourneyConfig): string {
  let content = '';
  if (config.references?.length) content += `${config.references.join(' ')} `;
  if (config.prompt) content += config.prompt;
  if (config.elements?.length) content += `,${config.elements.map((item) => item.value).join(',')}`;
  const isNiji = config.model?.includes('niji');
  if (config.model && !content.includes(`--${config.model}`)) content += ` --${config.model}`;
  if (!isNiji && config.version && !content.includes('--version ') && !content.includes('--v ')) {
    content += ` --version ${config.version}`;
  }
  if (config.chaos && config.advanced && !content.includes('--chaos ')) content += ` --chaos ${config.chaos}`;
  if (
    config.version !== '8.1' &&
    config.quality &&
    !content.includes('--quality ') &&
    !content.includes('--q ') &&
    config.quality !== MIDJOURNEY_DEFAULT_QUALITY
  ) {
    content += ` --quality ${config.quality}`;
  }
  if (
    config.ratio &&
    !content.includes('--aspect ') &&
    !content.includes('--ar ') &&
    config.ratio !== MIDJOURNEY_DEFAULT_RATIO
  ) {
    content += ` --aspect ${config.ratio}`;
  }
  if (
    config.stylize &&
    !content.includes('--stylize ') &&
    !content.includes('--s ') &&
    config.advanced &&
    config.stylize !== MIDJOURNEY_DEFAULT_STYLIZE
  ) {
    content += ` --stylize ${config.stylize}`;
  }
  if (
    config.weird &&
    !content.includes('--weird ') &&
    !content.includes('--w ') &&
    config.advanced &&
    config.weird !== MIDJOURNEY_DEFAULT_WIRED
  ) {
    content += ` --weird ${config.weird}`;
  }
  if (config.ignore && !content.includes('--no ')) content += ` --no ${config.ignore}`;
  if (config.iw && !content.includes('--iw ') && config.advanced && config.iw !== MIDJOURNEY_DEFAULT_IMAGE_WEIGHT) {
    content += ` --iw ${config.iw}`;
  }
  if (config.style && config.advanced && !content.includes('--style')) content += ` --style ${config.style}`;
  if (!isNiji && config.hd && !content.includes('--hd')) content += ' --hd';
  content = content.replace(/--(fast|relax|turbo) /g, '');
  return config.prompt || config.references?.length ? content : '';
}

export function buildMidjourneyImagineRequest(config: IMidjourneyConfig): IMidjourneyImagineRequest {
  const isV81 = config.version === '8.1';
  const isV8 = config.version === '8' || isV81;
  const prompt = buildFinalPrompt(config);
  return {
    mode: config.mode || MIDJOURNEY_DEFAULT_MODE,
    prompt,
    action: MidjourneyImagineAction.GENERATE,
    translation: config.translation,
    async: true,
    version: config.version,
    hd: config.hd || false,
    ...(!isV81 ? { quality: config.quality || MIDJOURNEY_DEFAULT_QUALITY } : {}),
    style_reference: prompt.includes('--sref'),
    moodboard: Boolean(isV8 && config.references?.length)
  };
}

export function buildMidjourneyCustomRequest(
  config: IMidjourneyConfig,
  payload: { image_id: string; action: MidjourneyImagineAction }
): IMidjourneyImagineRequest {
  const isV81 = config.version === '8.1';
  return {
    image_id: payload.image_id,
    action: payload.action,
    mode: isV81 ? MIDJOURNEY_DEFAULT_MODE : config.mode || MIDJOURNEY_DEFAULT_MODE,
    async: true,
    version: config.version,
    hd: config.hd || false,
    ...(!isV81 ? { quality: config.quality || MIDJOURNEY_DEFAULT_QUALITY } : {})
  };
}

export function buildMidjourneyVideosRequest(config: IMidjourneyConfig): IMidjourneyVideosRequest {
  return {
    video_id: config.video_id,
    image_url: config.image_url,
    action: config.action as MidjourneyVideosAction,
    prompt: config.prompt,
    end_image_url: config.end_image_url,
    resolution: config.resolution,
    loop: config.loop,
    mode: config.mode || MIDJOURNEY_DEFAULT_MODE,
    async: true
  };
}

export function buildMidjourneyDescribeRequest(config: IMidjourneyConfig): IMidjourneyDescribeRequest {
  return { image_url: config.image_url || '' };
}

class MidjourneyOperator {
  async task(id: string, options: OperatorRequestOptions): Promise<AxiosResponse<IMidjourneyTaskResponse>> {
    return axios.post(
      '/midjourney/tasks',
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
  ): Promise<AxiosResponse<IMidjourneyTasksResponse>> {
    return axios.post(
      '/midjourney/tasks',
      {
        action: 'retrieve_batch',
        ...(filter.ids ? { ids: filter.ids } : {}),
        ...(filter.applicationId ? { application_id: filter.applicationId } : {}),
        ...(filter.userId ? { user_id: filter.userId } : {}),
        ...(filter.type ? { type: filter.type } : {}),
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

  async quoteImagine(data: IMidjourneyImagineRequest) {
    return quoteX402('/midjourney/imagine', data, HEADERS);
  }
  async quoteVideos(data: IMidjourneyVideosRequest) {
    return quoteX402('/midjourney/videos', data, HEADERS);
  }
  async quoteDescribe(data: IMidjourneyDescribeRequest) {
    return quoteX402('/midjourney/describe', data, HEADERS);
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

  async imagine(data: IMidjourneyImagineRequest, options: OperatorRequestOptions) {
    return this.submit<IMidjourneyImagineResponse>('/midjourney/imagine', data, options);
  }
  async videos(data: IMidjourneyVideosRequest, options: OperatorRequestOptions) {
    return this.submit<IMidjourneyVideosResponse>('/midjourney/videos', data, options);
  }
  async describe(data: IMidjourneyDescribeRequest, options: OperatorRequestOptions) {
    return this.submit<IMidjourneyDescribeResponse>('/midjourney/describe', data, options);
  }
}

export const midjourneyOperator = new MidjourneyOperator();
