import { IMinimaxConfig } from '@/models';

export const validateMinimaxConfig = (
  config: IMinimaxConfig
): 'promptRequired' | 'imageLimit' | 'audioLimit' | 'textRatioRequired' | undefined => {
  if (!config.content.some((item) => item.type === 'text' && item.text.trim())) return 'promptRequired';
  if (config.content.filter((item) => item.type === 'image_url').length > 9) return 'imageLimit';
  if (config.content.filter((item) => item.type === 'audio_url').length > 3) return 'audioLimit';
  const hasMedia = config.content.some((item) => item.type !== 'text');
  if (!hasMedia && config.ratio === 'adaptive') return 'textRatioRequired';
  return undefined;
};

export function getMinimaxGenerationOptions(model: IMinimaxConfig['model']) {
  const max = model === 'MiniMax-H3-Max';
  return {
    resolutions: max ? (['480P', '768P'] as const) : (['768P', '2K'] as const),
    durations: Array.from({ length: max ? 11 : 12 }, (_, index) => index + (max ? 5 : 4))
  };
}
