// Video lives under the merged `grok` service (PlatformBackend migration 0176).
export const GROKVIDEO_SERVICE_ID = 'cbfe0ade-0b4e-4c42-83f4-3e2d5b429545';

export const GROKVIDEO_LOGO = 'https://cdn.acedata.cloud/p1ge98.png';

export const GROKVIDEO_MODEL_DEFAULT = 'grok-imagine-video';
export const GROKVIDEO_MODEL_1_5_PREVIEW = 'grok-imagine-video-1.5-preview';
export const GROKVIDEO_DEFAULT_MODEL = GROKVIDEO_MODEL_DEFAULT;

export const GROKVIDEO_RATIO_1_1 = '1:1';
export const GROKVIDEO_RATIO_16_9 = '16:9';
export const GROKVIDEO_RATIO_9_16 = '9:16';
export const GROKVIDEO_RATIO_4_3 = '4:3';
export const GROKVIDEO_RATIO_3_4 = '3:4';
export const GROKVIDEO_RATIO_3_2 = '3:2';
export const GROKVIDEO_RATIO_2_3 = '2:3';
export const GROKVIDEO_DEFAULT_RATIO = GROKVIDEO_RATIO_16_9;

export const GROKVIDEO_RESOLUTION_480P = '480p';
export const GROKVIDEO_RESOLUTION_720P = '720p';
export const GROKVIDEO_RESOLUTION_1080P = '1080p';
export const GROKVIDEO_DEFAULT_RESOLUTION = GROKVIDEO_RESOLUTION_480P;

export const GROKVIDEO_DEFAULT_DURATION = 8;

// grok-imagine-video (1.0) supports up to 30s; grok-imagine-video-1.5-preview up to 15s.
export const GROKVIDEO_MAX_DURATION_DEFAULT = 30;
export const GROKVIDEO_MAX_DURATION_1_5_PREVIEW = 15;

/** All selectable clip durations (seconds); filtered per-model by max duration. */
export const GROKVIDEO_DURATION_OPTIONS = [3, 5, 6, 8, 10, 12, 15, 20, 25, 30];

/** Models that only support image-to-video (require an input image). */
export const GROKVIDEO_IMAGE_ONLY_MODELS = [GROKVIDEO_MODEL_1_5_PREVIEW];

export const isGrokVideoImageOnlyModel = (model?: string): boolean =>
  !!model && GROKVIDEO_IMAGE_ONLY_MODELS.includes(model);

/** Max clip duration (seconds) for the given model. */
export const getGrokVideoMaxDuration = (model?: string): number =>
  model === GROKVIDEO_MODEL_1_5_PREVIEW ? GROKVIDEO_MAX_DURATION_1_5_PREVIEW : GROKVIDEO_MAX_DURATION_DEFAULT;
