export const KLING_SERVICE_ID = '3369e077-2500-4263-86c7-cae0f0e7e843';

export const KLING_LOGO = 'https://cdn.acedata.cloud/qpbbbb.jpg';

export const KLING_DEFAULT_MODEL = 'kling-v2-5-turbo';
export const KLING_DEFAULT_DURATION = 5;
export const KLING_DEFAULT_MODE = 'std';
export const KLING_DEFAULT_ASPECT_RATIO = '1:1';
export const KLING_DEFAULT_INGREDIENTS = false;
export const KLING_DEFAULT_CFG_SCALE = 0;
export const KLING_DEFAULT_GENERATE_AUDIO = false;

export const KLING_V3_MODELS = ['kling-v3', 'kling-v3-omni'];

// Talking Photo supports a narrower model set than video (no v3/omni/o1).
export const KLING_TALKING_PHOTO_MODELS = [
  'kling-v2-6',
  'kling-v2-5-turbo',
  'kling-v2-1-master',
  'kling-v2-master',
  'kling-v1-6',
  'kling-v1'
];
export const KLING_TALKING_PHOTO_DEFAULT_MODEL = 'kling-v2-1-master';
export const KLING_TALKING_PHOTO_DEFAULT_MODE: 'std' | 'pro' = 'pro';
