import { hasMeaningfulText } from './is';

export type GenerationInputError = 'promptRequired' | 'generationInputRequired';
export type GenerationInputService =
  | 'flux'
  | 'hailuo'
  | 'kling'
  | 'maestro'
  | 'midjourney-imagine'
  | 'midjourney-videos'
  | 'nanobanana'
  | 'pika'
  | 'pixverse'
  | 'producer'
  | 'qrart'
  | 'qwenimage'
  | 'seedance'
  | 'seedream'
  | 'sora'
  | 'veo'
  | 'wan';

type RequestLike = Record<string, any>;

const MEDIA_URL_KEYS = ['url', 'image_url', 'video_url', 'audio_url'] as const;

const hasMediaList = (value: unknown): boolean =>
  Array.isArray(value) &&
  value.some((item) => {
    if (hasMeaningfulText(item)) return true;
    if (!item || typeof item !== 'object') return false;
    return MEDIA_URL_KEYS.some((key) => hasMeaningfulText((item as Record<string, unknown>)[key]));
  });

export function getGenerationInputError(
  service: GenerationInputService,
  value: unknown
): GenerationInputError | undefined {
  const request = (value || {}) as RequestLike;
  const hasPrompt = hasMeaningfulText(request.prompt);

  switch (service) {
    case 'flux':
    case 'maestro':
    case 'nanobanana':
    case 'qrart':
    case 'qwenimage':
    case 'seedream':
      return hasPrompt ? undefined : 'promptRequired';
    case 'producer':
      return hasPrompt ||
        ['lyric', 'lyric_prompt', 'style', 'title', 'audio_id'].some((key) => hasMeaningfulText(request[key]))
        ? undefined
        : 'generationInputRequired';
    case 'veo':
      if ((request.action || 'text2video') === 'text2video') return hasPrompt ? undefined : 'promptRequired';
      return hasMediaList(request.image_urls) ? undefined : 'generationInputRequired';
    case 'sora':
      if ((request.action || 'text2video') === 'image2video') {
        return hasMediaList(request.image_urls) ? undefined : 'generationInputRequired';
      }
      return hasPrompt ? undefined : 'promptRequired';
    case 'hailuo':
      return hasPrompt || hasMeaningfulText(request.first_image_url) || hasMeaningfulText(request.video_url)
        ? undefined
        : 'generationInputRequired';
    case 'pixverse':
      return hasPrompt || hasMeaningfulText(request.image_url) ? undefined : 'generationInputRequired';
    case 'pika':
      return hasPrompt || hasMediaList(request.image_url) ? undefined : 'generationInputRequired';
    case 'wan':
      return hasPrompt || hasMeaningfulText(request.image_url) || hasMediaList(request.media)
        ? undefined
        : 'generationInputRequired';
    case 'kling':
      if (request.action === 'image2video') {
        return hasMeaningfulText(request.start_image_url) ? undefined : 'generationInputRequired';
      }
      if (request.action === 'extend') {
        return hasMeaningfulText(request.video_id) || hasMeaningfulText(request.video_url)
          ? undefined
          : 'generationInputRequired';
      }
      return hasPrompt || hasMediaList(request.image_list) || hasMediaList(request.video_list)
        ? undefined
        : 'promptRequired';
    case 'seedance':
      return hasPrompt || hasMediaList(request.images) || hasMediaList(request.videos) || hasMediaList(request.audios)
        ? undefined
        : 'generationInputRequired';
    case 'midjourney-imagine':
    case 'midjourney-videos':
      return hasPrompt ? undefined : 'promptRequired';
  }
}

export const canSubmitGeneration = (service: GenerationInputService, value: unknown): boolean =>
  getGenerationInputError(service, value) === undefined;
