import type { ISeedreamConfig, ISeedreamGenerateRequest } from '@/models';
import { SEEDREAM_MODEL_5_0_PRO } from '@/constants';
import { getSeedreamCapabilities } from './capabilities';

export const buildSeedreamRequest = (config?: ISeedreamConfig): ISeedreamGenerateRequest => {
  const request = { ...(config || {}) };
  if (typeof request.prompt === 'string') request.prompt = request.prompt.trim();
  delete request.action;
  delete request.stream;
  delete request.seed;
  delete request.guidance_scale;
  request.watermark = false;

  const capabilities = getSeedreamCapabilities(request.model);
  const decomposing = request.model === SEEDREAM_MODEL_5_0_PRO && request.layer_decomposition === true;
  if (!request.image?.length) delete request.image;
  if (!request.size) delete request.size;
  if (decomposing) {
    request.image = request.image?.slice(0, 1);
    request.size = request.size || 'auto';
    if (!request.prompt) delete request.prompt;
    delete request.background;
    delete request.sequential_image_generation;
    delete request.sequential_image_generation_options;
    delete request.tools;
  } else {
    delete request.layer_decomposition;
    if (!capabilities.transparentBackground) delete request.background;
    if (request.background === 'transparent') request.output_format = 'png';
    if (!capabilities.groupGeneration || request.sequential_image_generation !== 'auto') {
      if (!capabilities.groupGeneration) delete request.sequential_image_generation;
      delete request.sequential_image_generation_options;
    }
    if (!capabilities.webSearch) delete request.tools;
  }
  if (!capabilities.outputFormat) delete request.output_format;
  const optimizeMode = request.optimize_prompt_options?.mode;
  if (!optimizeMode || !capabilities.promptOptimization.includes(optimizeMode)) {
    delete request.optimize_prompt_options;
  }
  return { ...request, async: true };
};
