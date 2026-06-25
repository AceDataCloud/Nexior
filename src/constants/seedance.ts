export const SEEDANCE_SERVICE_ID = '762c5fd0-a81e-4c59-b9fe-16bcffad7d4a';

export const SEEDANCE_LOGO = 'https://cdn.acedata.cloud/9q90dl.png';

export const SEEDANCE_MODEL_1_0_PRO = 'doubao-seedance-1-0-pro-250528';
export const SEEDANCE_MODEL_1_0_PRO_FAST = 'doubao-seedance-1-0-pro-fast-251015';
export const SEEDANCE_MODEL_1_5_PRO = 'doubao-seedance-1-5-pro-251215';
export const SEEDANCE_MODEL_2_0 = 'doubao-seedance-2-0-260128';
export const SEEDANCE_MODEL_2_0_FAST = 'doubao-seedance-2-0-fast-260128';
export const SEEDANCE_MODEL_2_0_MINI = 'doubao-seedance-2-0-mini-260615';
export const SEEDANCE_MODEL_1_0_LITE_T2V = 'doubao-seedance-1-0-lite-t2v-250428';
export const SEEDANCE_MODEL_1_0_LITE_I2V = 'doubao-seedance-1-0-lite-i2v-250428';

export const SEEDANCE_DEFAULT_MODEL = SEEDANCE_MODEL_1_0_PRO;

export const SEEDANCE_SERVICE_TIER_DEFAULT = 'default';
export const SEEDANCE_SERVICE_TIER_FLEX = 'flex';
export const SEEDANCE_DEFAULT_SERVICE_TIER = SEEDANCE_SERVICE_TIER_DEFAULT;

export const SEEDANCE_DEFAULT_DURATION = 5;
export const SEEDANCE_DEFAULT_GENERATE_AUDIO = false;
export const SEEDANCE_DEFAULT_RETURN_LAST_FRAME = false;
export const SEEDANCE_DEFAULT_EXECUTION_EXPIRES_AFTER = 172800;

export const SEEDANCE_RESOLUTION_480P = '480p';
export const SEEDANCE_RESOLUTION_720P = '720p';
export const SEEDANCE_RESOLUTION_1080P = '1080p';
export const SEEDANCE_RESOLUTION_4K = '4k';
export const SEEDANCE_DEFAULT_RESOLUTION = SEEDANCE_RESOLUTION_720P;

export const SEEDANCE_DEFAULT_MAX_DURATION = 12;
export const SEEDANCE_2_0_MAX_DURATION = 15;

export const SEEDANCE_RATIO_16_9 = '16:9';
export const SEEDANCE_RATIO_4_3 = '4:3';
export const SEEDANCE_RATIO_1_1 = '1:1';
export const SEEDANCE_RATIO_3_4 = '3:4';
export const SEEDANCE_RATIO_9_16 = '9:16';
export const SEEDANCE_RATIO_21_9 = '21:9';
export const SEEDANCE_RATIO_ADAPTIVE = 'adaptive';
export const SEEDANCE_DEFAULT_RATIO = SEEDANCE_RATIO_16_9;

export const SEEDANCE_DEFAULT_CAMERA_FIXED = false;

/**
 * Per-model capability matrix used to pre-block invalid parameter combinations
 * in the studio before they reach the API and surface an opaque "model X is not
 * supported" error. Each entry mirrors the constraints enforced by the
 * volcengine and ephone workers and the OpenAPI spec for the Seedance video
 * endpoint.
 */
export interface ISeedanceModelCapability {
  /** Accepts text-only prompts (text-to-video). */
  acceptsText: boolean;
  /** Accepts first_frame / last_frame image inputs. */
  acceptsImage: boolean;
  /** Image input is mandatory (image-to-video only). */
  requiresImage: boolean;
  /** Accepts a last_frame image input (in addition to first_frame). */
  acceptsLastFrame: boolean;
  /** Honors the generate_audio flag (otherwise it's silently ignored upstream). */
  acceptsAudio: boolean;
  /** Honors return_last_frame (otherwise it's stripped upstream). */
  acceptsReturnLastFrame: boolean;
  /** Default resolution this model is calibrated for. */
  defaultResolution: string;
  /** Highest resolution the model accepts upstream (480p < 720p < 1080p < 4k). */
  maxResolution: string;
  /** Shortest clip duration (seconds) shown for this model. */
  minDuration: number;
  /** Longest clip duration (seconds) the model accepts. */
  maxDuration: number;
  /** Accepts reference image(s) as subject input (Seedance 2.0 multimodal). */
  acceptsReferenceImage: boolean;
  /** Accepts a reference audio input (Seedance 2.0 multimodal talking-head). */
  acceptsReferenceAudio: boolean;
  /** Accepts a reference video input (Seedance 2.0 multimodal). */
  acceptsReferenceVideo: boolean;
}

export const SEEDANCE_MODEL_CAPABILITIES: Record<string, ISeedanceModelCapability> = {
  [SEEDANCE_MODEL_1_0_PRO]: {
    acceptsText: true,
    acceptsImage: true,
    requiresImage: false,
    acceptsLastFrame: true,
    acceptsAudio: false,
    acceptsReturnLastFrame: true,
    defaultResolution: SEEDANCE_RESOLUTION_1080P,
    maxResolution: SEEDANCE_RESOLUTION_1080P,
    minDuration: 2,
    maxDuration: SEEDANCE_DEFAULT_MAX_DURATION,
    acceptsReferenceImage: false,
    acceptsReferenceAudio: false,
    acceptsReferenceVideo: false
  },
  [SEEDANCE_MODEL_1_0_PRO_FAST]: {
    acceptsText: true,
    acceptsImage: true,
    requiresImage: false,
    acceptsLastFrame: true,
    acceptsAudio: false,
    acceptsReturnLastFrame: true,
    defaultResolution: SEEDANCE_RESOLUTION_1080P,
    maxResolution: SEEDANCE_RESOLUTION_1080P,
    minDuration: 2,
    maxDuration: SEEDANCE_DEFAULT_MAX_DURATION,
    acceptsReferenceImage: false,
    acceptsReferenceAudio: false,
    acceptsReferenceVideo: false
  },
  [SEEDANCE_MODEL_1_5_PRO]: {
    acceptsText: true,
    acceptsImage: true,
    requiresImage: false,
    acceptsLastFrame: true,
    acceptsAudio: true,
    acceptsReturnLastFrame: true,
    defaultResolution: SEEDANCE_RESOLUTION_720P,
    maxResolution: SEEDANCE_RESOLUTION_1080P,
    minDuration: 2,
    maxDuration: SEEDANCE_DEFAULT_MAX_DURATION,
    acceptsReferenceImage: false,
    acceptsReferenceAudio: false,
    acceptsReferenceVideo: false
  },
  [SEEDANCE_MODEL_2_0]: {
    acceptsText: true,
    acceptsImage: true,
    requiresImage: false,
    acceptsLastFrame: true,
    acceptsAudio: true,
    acceptsReturnLastFrame: false,
    defaultResolution: SEEDANCE_RESOLUTION_1080P,
    maxResolution: SEEDANCE_RESOLUTION_4K,
    minDuration: 4,
    maxDuration: SEEDANCE_2_0_MAX_DURATION,
    acceptsReferenceImage: true,
    acceptsReferenceAudio: true,
    acceptsReferenceVideo: true
  },
  [SEEDANCE_MODEL_2_0_FAST]: {
    acceptsText: true,
    acceptsImage: true,
    requiresImage: false,
    acceptsLastFrame: true,
    acceptsAudio: true,
    acceptsReturnLastFrame: false,
    defaultResolution: SEEDANCE_RESOLUTION_720P,
    maxResolution: SEEDANCE_RESOLUTION_720P,
    minDuration: 4,
    maxDuration: SEEDANCE_2_0_MAX_DURATION,
    acceptsReferenceImage: true,
    acceptsReferenceAudio: true,
    acceptsReferenceVideo: true
  },
  [SEEDANCE_MODEL_2_0_MINI]: {
    acceptsText: true,
    acceptsImage: true,
    requiresImage: false,
    acceptsLastFrame: true,
    acceptsAudio: true,
    acceptsReturnLastFrame: false,
    defaultResolution: SEEDANCE_RESOLUTION_720P,
    maxResolution: SEEDANCE_RESOLUTION_720P,
    minDuration: 4,
    maxDuration: SEEDANCE_2_0_MAX_DURATION,
    acceptsReferenceImage: true,
    acceptsReferenceAudio: true,
    acceptsReferenceVideo: true
  },
  [SEEDANCE_MODEL_1_0_LITE_T2V]: {
    acceptsText: true,
    acceptsImage: false,
    requiresImage: false,
    acceptsLastFrame: false,
    acceptsAudio: false,
    acceptsReturnLastFrame: false,
    defaultResolution: SEEDANCE_RESOLUTION_720P,
    maxResolution: SEEDANCE_RESOLUTION_720P,
    minDuration: 2,
    maxDuration: SEEDANCE_DEFAULT_MAX_DURATION,
    acceptsReferenceImage: false,
    acceptsReferenceAudio: false,
    acceptsReferenceVideo: false
  },
  [SEEDANCE_MODEL_1_0_LITE_I2V]: {
    acceptsText: false,
    acceptsImage: true,
    requiresImage: true,
    acceptsLastFrame: false,
    acceptsAudio: false,
    acceptsReturnLastFrame: false,
    defaultResolution: SEEDANCE_RESOLUTION_720P,
    maxResolution: SEEDANCE_RESOLUTION_720P,
    minDuration: 2,
    maxDuration: SEEDANCE_DEFAULT_MAX_DURATION,
    acceptsReferenceImage: false,
    acceptsReferenceAudio: false,
    acceptsReferenceVideo: false
  }
};

export const getSeedanceCapability = (model: string | undefined): ISeedanceModelCapability => {
  if (model && SEEDANCE_MODEL_CAPABILITIES[model]) {
    return SEEDANCE_MODEL_CAPABILITIES[model];
  }
  return SEEDANCE_MODEL_CAPABILITIES[SEEDANCE_DEFAULT_MODEL];
};
