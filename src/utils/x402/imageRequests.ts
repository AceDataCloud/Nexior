import {
  NANOBANANA_DEFAULT_RESOLUTION,
  NANOBANANA_MODEL_NANO_BANANA_2,
  NANOBANANA_MODEL_NANO_BANANA_PRO
} from '@/constants';
import type {
  INanobananaConfig,
  INanobananaGenerateRequest,
  IOpenAIImageConfig,
  IOpenAIImageGenerateRequest
} from '@/models';

export function buildNanobananaRequest(config?: INanobananaConfig): INanobananaGenerateRequest {
  const request: INanobananaGenerateRequest = { ...(config || {}) };
  const hasReferenceImages = Array.isArray(request.image_urls) && request.image_urls.length > 0;
  if (!hasReferenceImages) delete request.image_urls;
  if (!request.aspect_ratio) delete request.aspect_ratio;

  const supportsResolution =
    request.model === NANOBANANA_MODEL_NANO_BANANA_2 || request.model === NANOBANANA_MODEL_NANO_BANANA_PRO;
  if (!supportsResolution) delete request.resolution;
  if (supportsResolution && !request.resolution) request.resolution = NANOBANANA_DEFAULT_RESOLUTION;

  return {
    ...request,
    action: hasReferenceImages ? 'edit' : 'generate',
    async: true
  };
}

export function buildOpenAIImageGenerateRequest(config?: IOpenAIImageConfig): IOpenAIImageGenerateRequest {
  const request: IOpenAIImageGenerateRequest = { ...(config || {}) };
  delete request.image_urls;
  if (!request.size) delete request.size;
  if (typeof request.prompt === 'string') request.prompt = request.prompt.trim();
  return { ...request, action: 'generate', async: true };
}
