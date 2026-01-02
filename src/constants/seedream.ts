export const SEEDREAM_SERVICE_ID = 'a0a296f0-22de-422b-943d-1c623a73b8dd';

export const SEEDREAM_LOGO = 'https://cdn.acedata.cloud/9egrbn.png';

export const SEEDREAM_MODEL_4_0 = 'doubao-seedream-4-0-250828';
export const SEEDREAM_MODEL_4_5 = 'doubao-seedream-4-5-251128';
export const SEEDREAM_MODEL_3_0_T2I = 'doubao-seedream-3-0-t2i-250415';
export const SEEDREAM_MODEL_SEEDEDIT_3_0_I2I = 'doubao-seededit-3-0-i2i-250628';

export const SEEDREAM_DEFAULT_MODEL = SEEDREAM_MODEL_4_5;

export const SEEDREAM_SIZE_1K = '1K';
export const SEEDREAM_SIZE_2K = '2K';
export const SEEDREAM_SIZE_4K = '4K';

export const SEEDREAM_DEFAULT_SIZE = SEEDREAM_SIZE_2K;

export const SEEDREAM_DEFAULT_WATERMARK = false;

export const SEEDREAM_MODEL_FULL_TO_SHORT: Record<string, string> = {
  [SEEDREAM_MODEL_4_5]: 'doubao-seedream-4.5',
  [SEEDREAM_MODEL_4_0]: 'doubao-seedream-4.0',
  [SEEDREAM_MODEL_3_0_T2I]: 'doubao-seedream-3.0-t2i',
  [SEEDREAM_MODEL_SEEDEDIT_3_0_I2I]: 'doubao-seededit-3.0-i2i'
};

export const getSeedreamShortModel = (model?: string): string | undefined => {
  if (!model) return undefined;
  return SEEDREAM_MODEL_FULL_TO_SHORT[model] || model;
};
