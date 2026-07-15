import { IVeoConfig, IVeoGenerateRequest } from '@/models';
import { VEO_DEFAULT_ACTION, VEO_DEFAULT_MODEL } from '@/constants';

export type VeoAction = 'text2video' | 'image2video' | 'ingredients2video';

export const VEO_INGREDIENTS_MODEL = 'veo31-fast-ingredients';

export const VEO_GENERATION_MODELS = [
  { value: 'veo31-fast', label: 'Veo 3.1 Fast' },
  { value: 'veo3-fast', label: 'Veo 3 Fast' },
  { value: 'veo31', label: 'Veo 3.1' },
  { value: 'veo3', label: 'Veo 3' }
] as const;

export const normalizeVeoConfigForAction = (config: IVeoConfig | undefined, action: VeoAction): IVeoConfig => {
  const actionChanged = Boolean(config?.action && config.action !== action);
  const next: IVeoConfig = {
    ...config,
    action
  };

  if (action === 'text2video') {
    next.model = next.model === VEO_INGREDIENTS_MODEL ? VEO_DEFAULT_MODEL : next.model || VEO_DEFAULT_MODEL;
    delete next.image_urls;
    return next;
  }

  if (action === 'ingredients2video') {
    next.model = VEO_INGREDIENTS_MODEL;
    if (actionChanged) {
      delete next.image_urls;
    } else {
      next.image_urls = next.image_urls?.slice(0, 3);
    }
    return next;
  }

  next.model = next.model === VEO_INGREDIENTS_MODEL ? VEO_DEFAULT_MODEL : next.model || VEO_DEFAULT_MODEL;
  if (actionChanged) {
    delete next.image_urls;
  } else {
    next.image_urls = next.image_urls?.slice(0, 2);
  }
  return next;
};

export const buildVeoGenerateRequest = (config: IVeoConfig | undefined): IVeoGenerateRequest => {
  const action = (config?.action || VEO_DEFAULT_ACTION) as VeoAction;
  const request = {
    ...normalizeVeoConfigForAction(config, action),
    async: true
  } as IVeoGenerateRequest;

  if (!request.image_urls?.length) {
    delete request.image_urls;
  }
  return request;
};
