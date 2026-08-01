export const DIGITALHUMAN_SERVICE_ID = '5b132265-40e8-4a79-9582-589f8eea4733';

export const DIGITALHUMAN_LOGO = 'https://cdn.acedata.cloud/uploads/b47b3899-d41a-4295-93b9-20686ac98598';

export const DIGITALHUMAN_DEFAULT_LANG = 'zh';
export const DIGITALHUMAN_ALLOWED_LANGS = ['zh', 'en'];

// Upload accept filters (face video/photo + voice audio sample).
export const DIGITALHUMAN_VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/webm';
export const DIGITALHUMAN_IMAGE_ACCEPT = 'image/png,image/jpeg,image/webp';
export const DIGITALHUMAN_AUDIO_ACCEPT = 'audio/wav,audio/mpeg,audio/mp4,audio/x-m4a';

// A 720p render measured ~2500s end to end. Used only to tell the user roughly
// how long they will be waiting, never to decide anything.
export const DIGITALHUMAN_ETA_SECONDS = 2400;

// Cloning a voice costs credits, so the book of what a user already cloned has
// to survive a reload — the API can create voices but cannot list them.
export const DIGITALHUMAN_VOICES_STORAGE_KEY = 'digitalhuman.voices';
export const DIGITALHUMAN_VOICE_CLONE_CONSUMPTION = 2;
