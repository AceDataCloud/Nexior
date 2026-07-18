import type { ISeedreamConfig, ISeedreamGenerateRequest } from '@/models';

export const buildSeedreamRequest = (config?: ISeedreamConfig): ISeedreamGenerateRequest => {
  const request = { ...(config || {}) };
  const action = request.action === 'edit' ? 'edit' : 'generate';
  delete request.action;

  if (action !== 'edit' || !request.image?.length) {
    delete request.image;
  }
  if (!request.size) {
    delete request.size;
  }

  return { ...request, async: true };
};
