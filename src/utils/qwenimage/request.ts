import type { IQwenImageConfig, IQwenImageGenerateRequest } from '@/models';
export const buildQwenImageRequest = (config?: IQwenImageConfig): IQwenImageGenerateRequest => {
  const source = { ...(config || {}) };
  const image_urls = source.image?.length ? source.image : undefined;
  delete source.image;
  return { ...source, image_urls, watermark: false, async: true };
};
