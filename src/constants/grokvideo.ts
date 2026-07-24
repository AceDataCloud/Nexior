// Video lives under the merged `grok` service (PlatformBackend migration 0176).
export const GROKVIDEO_SERVICE_ID = 'cbfe0ade-0b4e-4c42-83f4-3e2d5b429545';

export const GROKVIDEO_LOGO = 'https://cdn.acedata.cloud/p1ge98.png';

// TTAPI exposes two grok-video backends; the model suffix selects the endpoint:
//   :reverse  -> UnOfficial (grok-imagine-video-1.5-fast is the cheap flat-tier model)
//   :official -> Official (higher fidelity, per-second pricing)
export const GROKVIDEO_MODEL_FAST_REVERSE = 'grok-imagine-video-1.5-fast:reverse';
export const GROKVIDEO_MODEL_REVERSE = 'grok-imagine-video:reverse';
export const GROKVIDEO_MODEL_OFFICIAL = 'grok-imagine-video:official';
export const GROKVIDEO_MODEL_1_5_OFFICIAL = 'grok-imagine-video-1.5:official';
export const GROKVIDEO_DEFAULT_MODEL = GROKVIDEO_MODEL_FAST_REVERSE;

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

export const GROKVIDEO_DEFAULT_DURATION = 6;

// Duration bounds per model: reverse 1.5-fast is 6-30s; every other variant is 1-15s.
export const GROKVIDEO_MAX_DURATION_FAST = 30;
export const GROKVIDEO_MAX_DURATION_OTHER = 15;
export const GROKVIDEO_MIN_DURATION_FAST = 6;
export const GROKVIDEO_MIN_DURATION_OTHER = 1;

/** All selectable clip durations (seconds); filtered per-model by min/max. */
export const GROKVIDEO_DURATION_OPTIONS = [1, 3, 5, 6, 8, 10, 12, 15, 20, 25, 30];

/** Models that only support image-to-video (require an input image). */
export const GROKVIDEO_IMAGE_ONLY_MODELS = [GROKVIDEO_MODEL_1_5_OFFICIAL];

export const isGrokVideoImageOnlyModel = (model?: string): boolean =>
  !!model && GROKVIDEO_IMAGE_ONLY_MODELS.includes(model);

/** Max clip duration (seconds) for the given model. */
export const getGrokVideoMaxDuration = (model?: string): number =>
  model === GROKVIDEO_MODEL_FAST_REVERSE ? GROKVIDEO_MAX_DURATION_FAST : GROKVIDEO_MAX_DURATION_OTHER;

/** Min clip duration (seconds) for the given model. */
export const getGrokVideoMinDuration = (model?: string): number =>
  model === GROKVIDEO_MODEL_FAST_REVERSE ? GROKVIDEO_MIN_DURATION_FAST : GROKVIDEO_MIN_DURATION_OTHER;
