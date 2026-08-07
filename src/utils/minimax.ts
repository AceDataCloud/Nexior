import { IMinimaxConfig } from '@/models';

export const validateMinimaxConfig = (
  config: IMinimaxConfig
): 'promptRequired' | 'imageLimit' | 'audioLimit' | 'audioImageRequired' | undefined => {
  if (!config.prompt?.trim()) return 'promptRequired';
  if ((config.image_urls?.length || 0) > 9) return 'imageLimit';
  if ((config.audio_urls?.length || 0) > 3) return 'audioLimit';
  if (config.audio_urls?.length && !config.image_urls?.length) return 'audioImageRequired';
  return undefined;
};
