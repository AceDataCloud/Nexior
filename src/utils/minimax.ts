import { IMinimaxConfig, IMinimaxMode } from '@/models';

export const parseMinimaxUrls = (value: string): string[] =>
  value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const deriveMinimaxMode = (imageUrls: string[], audioUrls: string[]): IMinimaxMode => {
  if (audioUrls.length) return 'audio_guided';
  if (imageUrls.length) return 'image_to_video';
  return 'text_to_video';
};

export const validateMinimaxConfig = (
  config: IMinimaxConfig
): 'promptRequired' | 'imageLimit' | 'audioLimit' | 'audioImageRequired' | undefined => {
  if (!config.prompt?.trim()) return 'promptRequired';
  if ((config.image_urls?.length || 0) > 9) return 'imageLimit';
  if ((config.audio_urls?.length || 0) > 3) return 'audioLimit';
  if (config.audio_urls?.length && !config.image_urls?.length) return 'audioImageRequired';
  return undefined;
};
