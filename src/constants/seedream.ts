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
export const SEEDREAM_SIZE_ADAPTIVE = 'adaptive';

export const SEEDREAM_DEFAULT_SIZE = SEEDREAM_SIZE_2K;

export const SEEDREAM_DEFAULT_WATERMARK = false;

// Common explicit width×height presets (aspect ratio + pixel dimensions).
// The Volcengine LAS API accepts any `<width>x<height>` string in addition to
// the 1K-4K tier presets and `adaptive`. These cover the most useful aspect
// ratios at 1K (~1MP) and 2K (~4MP).
export const SEEDREAM_PIXEL_PRESETS: { value: string; ratio: string }[] = [
  { value: '1024x1024', ratio: '1:1' },
  { value: '1280x720', ratio: '16:9' },
  { value: '720x1280', ratio: '9:16' },
  { value: '1152x864', ratio: '4:3' },
  { value: '864x1152', ratio: '3:4' },
  { value: '1216x832', ratio: '3:2' },
  { value: '832x1216', ratio: '2:3' },
  { value: '2048x2048', ratio: '1:1' },
  { value: '2560x1440', ratio: '16:9' },
  { value: '1440x2560', ratio: '9:16' },
  { value: '2304x1728', ratio: '4:3' },
  { value: '1728x2304', ratio: '3:4' }
];

// Per-model `guidance_scale` defaults — read by both GuidanceScaleInput and
// `utils/seedream/capabilities.ts`. Mirrors the upstream defaults at
// PlatformService/volcengine/worker/src/handlers/seedream/images.ts.
export const SEEDREAM_GUIDANCE_SCALE_DEFAULTS: Record<string, number> = {
  [SEEDREAM_MODEL_3_0_T2I]: 2.5,
  [SEEDREAM_MODEL_SEEDEDIT_3_0_I2I]: 5.5
};

export const SEEDREAM_OUTPUT_FORMATS = ['jpeg', 'png'] as const;

// Group / multi-image generation:
// Volcengine LAS supports up to 15 images per request when
// `sequential_image_generation=auto`, gated by:
//   (input reference images) + (generated images) <= 15.
export const SEEDREAM_MAX_IMAGES_LIMIT = 15;
export const SEEDREAM_DEFAULT_MAX_IMAGES = 1;

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
