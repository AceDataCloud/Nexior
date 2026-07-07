export const MAESTRO_SERVICE_ID = '0d7031bf-610a-419e-a5a0-db8f240286d5';

export const MAESTRO_LOGO = 'https://cdn.acedata.cloud/ee49012887.svg';

export const MAESTRO_ACTION_GENERATE = 'generate';
export const MAESTRO_ACTION_REMIX = 'remix';
export const MAESTRO_ACTION_EDIT = 'edit';
export const MAESTRO_ACTION_EXTEND = 'extend';

export const MAESTRO_ALLOWED_ASPECTS = ['9:16', '16:9', '1:1'];
export const MAESTRO_ALLOWED_LANGS = ['zh-cn', 'en', 'ja', 'ko', 'es', 'fr', 'de'];
// Duration is billed per second (up to 10 min); the user types any value in this range.
export const MAESTRO_MIN_DURATION = 1;
export const MAESTRO_MAX_DURATION = 600;
// Production tier (effort/price): draft = fast preview, standard = balanced, premium = richer.
export const MAESTRO_ALLOWED_QUALITIES = ['draft', 'standard', 'premium'];
// Video type: a routing hint. `auto` lets the director pick; the rest bias the route.
// Legacy values (general/explainer/product/website/changelog -> auto; slides/slideshow -> auto)
// are still accepted by the API but no longer offered here.
export const MAESTRO_ALLOWED_SCENARIOS = ['auto', 'narrated', 'drama', 'avatar', 'motion', 'captions'];
// Preview thumbnail per scenario — real frames from generated videos (narrated/drama/avatar/captions);
// auto/motion stay as illustrations. Hosted on the CDN like MAESTRO_LOGO.
export const MAESTRO_SCENARIO_THUMBNAILS: Record<string, string> = {
  auto: 'https://cdn.acedata.cloud/f61b85476e.png',
  narrated: 'https://cdn.acedata.cloud/db6ef158be.jpg',
  drama: 'https://cdn.acedata.cloud/af85b29164.jpg',
  avatar: 'https://cdn.acedata.cloud/7ae3e94d5a.jpg',
  motion: 'https://cdn.acedata.cloud/ab9dc386b6.png',
  captions: 'https://cdn.acedata.cloud/9a6d16d9f3.jpg'
};
// Visual style presets — each maps to a real named capability on the backend (a visual-styles
// identity, a palette, or a recipe like glass/retro). Freeform text still works. Orthogonal to scenario.
export const MAESTRO_ALLOWED_STYLES = [
  'auto',
  'cinematic',
  'glass',
  'luxury',
  'swiss',
  'modern',
  'editorial',
  'warm',
  'vibrant',
  'neon',
  'mono',
  'pastel',
  'bold',
  'industrial',
  'futuristic',
  'retro'
];

// Accepted reference media for file_urls (images / video / audio).
export const MAESTRO_FILE_ACCEPT = '.png,.jpg,.jpeg,.gif,.bmp,.webp,.mp4,.mov,.webm,.mp3,.wav,.m4a';
export const MAESTRO_FILE_LIMIT = 6;

export const MAESTRO_DEFAULT_ACTION = MAESTRO_ACTION_GENERATE;
export const MAESTRO_DEFAULT_LANGS = ['zh-cn'];
export const MAESTRO_DEFAULT_ASPECT = '9:16';
export const MAESTRO_DEFAULT_DURATION = 30;
export const MAESTRO_DEFAULT_QUALITY = 'standard';
export const MAESTRO_DEFAULT_SCENARIO = 'auto';
export const MAESTRO_DEFAULT_STYLE = 'auto';
