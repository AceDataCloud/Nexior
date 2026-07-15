// Omni video (omni-flash) is exposed under the merged `gemini` service
// (/gemini/videos, /gemini/tasks) — the same PlatformBackend service as gemini
// chat, so it shares the user's application / balance.
export const OMNI_SERVICE_ID = 'dda998fe-e11f-41b8-afa9-0a9b8420d60d';

export const OMNI_LOGO = 'https://cdn.acedata.cloud/psfx0g.jpg';

export const OMNI_MODEL_OMNI_FLASH = 'omni-flash';
export const OMNI_DEFAULT_MODEL = OMNI_MODEL_OMNI_FLASH;
export const OMNI_MODELS = [OMNI_MODEL_OMNI_FLASH];

export const OMNI_RATIO_16_9 = '16:9';
export const OMNI_RATIO_9_16 = '9:16';
export const OMNI_DEFAULT_RATIO = OMNI_RATIO_16_9;

export const OMNI_RESOLUTION_720P = '720p';
export const OMNI_RESOLUTION_1080P = '1080p';
export const OMNI_DEFAULT_RESOLUTION = OMNI_RESOLUTION_720P;

/** Reference images (image_urls) allowed to guide / edit the video. */
export const OMNI_MAX_IMAGES = 4;
/** Reference / editable video (video_urls) — upstream accepts at most one. */
export const OMNI_MAX_VIDEOS = 1;
