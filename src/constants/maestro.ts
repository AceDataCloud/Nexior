export const MAESTRO_SERVICE_ID = '0d7031bf-610a-419e-a5a0-db8f240286d5';

export const MAESTRO_LOGO = 'https://cdn.acedata.cloud/df0e7b7eea.svg';

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
// Legacy values (general/explainer/product/website/changelog -> auto; slides/slideshow/motion -> auto)
// are still accepted by the API but no longer offered here.
export const MAESTRO_ALLOWED_SCENARIOS = ['auto', 'narrated', 'drama', 'avatar', 'captions'];
// `captions` post-processes an EXISTING talking-head video, so it requires an uploaded source clip.
export const MAESTRO_UPLOAD_REQUIRED_SCENARIOS = ['captions'];
// Preview thumbnail per scenario — a cohesive set of purpose-made 3:4 portrait
// thumbnails (subject/head in the upper frame) so each Video Type reads at a
// glance in the compact vertical cards. Hosted on the CDN like MAESTRO_LOGO.
export const MAESTRO_SCENARIO_THUMBNAILS: Record<string, string> = {
  auto: 'https://cdn.acedata.cloud/58bf7feea4.jpg',
  narrated: 'https://cdn.acedata.cloud/fb12495d70.jpg',
  drama: 'https://cdn.acedata.cloud/33b9189ad0.jpg',
  avatar: 'https://cdn.acedata.cloud/540bda9cb6.jpg',
  captions: 'https://cdn.acedata.cloud/e86fddfc71.jpg'
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

// Curated narration voices → a Fish reference_id on the backend. Voice is a **timbre** and is
// language-agnostic: the same voice speaks whatever language `langs` sets (verified live zh/en/ja),
// so there is no per-voice language and the list is never filtered. `auto` = Maestro picks per tone.
// `sample` is a short bilingual preview clip on the CDN (▶︎ 试听).
export interface IMaestroVoiceOption {
  key: string;
  sample?: string;
}
export const MAESTRO_ALLOWED_VOICES: IMaestroVoiceOption[] = [
  { key: 'auto' },
  { key: 'warm-female', sample: 'https://cdn.acedata.cloud/7b7cec364c.mp3' },
  { key: 'bright-female', sample: 'https://cdn.acedata.cloud/32ee903837.mp3' },
  { key: 'anchor-female', sample: 'https://cdn.acedata.cloud/04374b7885.mp3' },
  { key: 'clean-female', sample: 'https://cdn.acedata.cloud/cc0776b86f.mp3' },
  { key: 'calm-male', sample: 'https://cdn.acedata.cloud/2ea4b5eb49.mp3' },
  { key: 'deep-male', sample: 'https://cdn.acedata.cloud/7ba529ae25.mp3' },
  { key: 'documentary-male', sample: 'https://cdn.acedata.cloud/5617e445dd.mp3' },
  { key: 'energetic-male', sample: 'https://cdn.acedata.cloud/d516b56517.mp3' },
  { key: 'storyteller-male', sample: 'https://cdn.acedata.cloud/9dfbd0ed00.mp3' }
];
export const MAESTRO_DEFAULT_VOICE = 'auto';
