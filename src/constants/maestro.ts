export const MAESTRO_SERVICE_ID = '0d7031bf-610a-419e-a5a0-db8f240286d5';

export const MAESTRO_LOGO = 'https://cdn.acedata.cloud/ee49012887.svg';

export const MAESTRO_ACTION_GENERATE = 'generate';
export const MAESTRO_ACTION_REMIX = 'remix';
export const MAESTRO_ACTION_EDIT = 'edit';
export const MAESTRO_ACTION_EXTEND = 'extend';

export const MAESTRO_ALLOWED_ASPECTS = ['9:16', '16:9', '1:1'];
export const MAESTRO_ALLOWED_LANGS = ['zh-cn', 'en', 'ja', 'ko', 'es', 'fr', 'de'];
export const MAESTRO_ALLOWED_DURATIONS = [20, 30, 45, 60];
// Production tier (effort/price): draft = fast preview, standard = balanced, premium = richer.
export const MAESTRO_ALLOWED_QUALITIES = ['draft', 'standard', 'premium'];

// Accepted reference media for file_urls (images / video / audio).
export const MAESTRO_FILE_ACCEPT = '.png,.jpg,.jpeg,.gif,.bmp,.webp,.mp4,.mov,.webm,.mp3,.wav,.m4a';
export const MAESTRO_FILE_LIMIT = 6;

export const MAESTRO_DEFAULT_ACTION = MAESTRO_ACTION_GENERATE;
export const MAESTRO_DEFAULT_LANGS = ['zh-cn'];
export const MAESTRO_DEFAULT_ASPECT = '9:16';
export const MAESTRO_DEFAULT_DURATION = 30;
export const MAESTRO_DEFAULT_QUALITY = 'standard';
