export const SEEDREAM_SERVICE_ID = 'a0a296f0-22de-422b-943d-1c623a73b8dd';

export const SEEDREAM_LOGO = 'https://cdn.acedata.cloud/9egrbn.png';

export const SEEDREAM_MODEL_4_0 = 'doubao-seedream-4-0-250828';
export const SEEDREAM_MODEL_4_5 = 'doubao-seedream-4-5-251128';
export const SEEDREAM_MODEL_5_0 = 'doubao-seedream-5-0-260128';
export const SEEDREAM_MODEL_3_0_T2I = 'doubao-seedream-3-0-t2i-250415';
export const SEEDREAM_MODEL_SEEDEDIT_3_0_I2I = 'doubao-seededit-3-0-i2i-250628';

export const SEEDREAM_DEFAULT_MODEL = SEEDREAM_MODEL_4_5;

export const SEEDREAM_SIZE_1K = '1K';
export const SEEDREAM_SIZE_2K = '2K';
export const SEEDREAM_SIZE_3K = '3K';
export const SEEDREAM_SIZE_4K = '4K';

export const SEEDREAM_DEFAULT_SIZE = SEEDREAM_SIZE_2K;

export const SEEDREAM_DEFAULT_WATERMARK = false;

// Group / multi-image generation:
// Volcengine LAS supports up to 15 images per request when
// `sequential_image_generation=auto`, gated by:
//   (input reference images) + (generated images) <= 15.
// 4.0 / 4.5 / 5.0 are the only models that support it; 3.0-t2i and
// seededit-3.0-i2i are single-image only.
export const SEEDREAM_MAX_IMAGES_LIMIT = 15;
export const SEEDREAM_DEFAULT_MAX_IMAGES = 1;
export const SEEDREAM_GROUP_GENERATION_MODELS: string[] = [SEEDREAM_MODEL_5_0, SEEDREAM_MODEL_4_5, SEEDREAM_MODEL_4_0];

export const supportsSeedreamGroupGeneration = (model?: string): boolean => {
  if (!model) return false;
  return SEEDREAM_GROUP_GENERATION_MODELS.includes(model);
};

export const SEEDREAM_MODEL_FULL_TO_SHORT: Record<string, string> = {
  [SEEDREAM_MODEL_5_0]: 'doubao-seedream-5.0',
  [SEEDREAM_MODEL_4_5]: 'doubao-seedream-4.5',
  [SEEDREAM_MODEL_4_0]: 'doubao-seedream-4.0',
  [SEEDREAM_MODEL_3_0_T2I]: 'doubao-seedream-3.0-t2i',
  [SEEDREAM_MODEL_SEEDEDIT_3_0_I2I]: 'doubao-seededit-3.0-i2i'
};

export const getSeedreamShortModel = (model?: string): string | undefined => {
  if (!model) return undefined;
  return SEEDREAM_MODEL_FULL_TO_SHORT[model] || model;
};
