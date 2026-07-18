import type { ISeedreamConfig, ISeedreamGenerateRequest } from '@/models';
import { getSeedreamAction } from './capabilities';

export const buildSeedreamRequest = (config?: ISeedreamConfig): ISeedreamGenerateRequest => {
  const request = { ...(config || {}) };
  const action = getSeedreamAction(request.model, request.image);
  delete request.action;

  if (action !== 'edit' || !request.image?.length) {
    delete request.image;
  }
  if (!request.size) {
    delete request.size;
  }
  if (request.sequential_image_generation !== 'auto') {
    delete request.sequential_image_generation_options;
  }

  return { ...request, async: true };
};
