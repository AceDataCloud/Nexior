import type { ISeedreamConfig, ISeedreamGenerateRequest } from '@/models';
import { SEEDREAM_MODEL_5_0_PRO, SEEDREAM_MODEL_5_5 } from '@/constants';
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
  const decomposing = capabilities.layerDecomposition && request.layer_decomposition === true;
  const v55 = request.model === SEEDREAM_MODEL_5_5;
  if (!v55 || !decomposing) delete request.layer_decomposition_options;
  if (!request.image?.length) delete request.image;
  if (!request.size) delete request.size;
  if (decomposing) {
    if (Array.isArray(request.image)) request.image = request.image.slice(0, 1);
    request.size = request.size || 'auto';
    if (!request.prompt) delete request.prompt;
    delete request.background;
    delete request.sequential_image_generation;
    delete request.sequential_image_generation_options;
    delete request.tools;
    if (request.model !== SEEDREAM_MODEL_5_0_PRO) request.response_format = 'url';
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
