import type { IQwenImageConfig, IQwenImageGenerateRequest } from '@/models';
export const buildQwenImageRequest = (config?: IQwenImageConfig): IQwenImageGenerateRequest => {
  const source = { ...(config || {}) };
  if (typeof source.prompt === 'string') source.prompt = source.prompt.trim();
  const image_urls = source.image?.length ? source.image : undefined;
  delete source.image;
  return { ...source, image_urls, watermark: false, async: true };
};
