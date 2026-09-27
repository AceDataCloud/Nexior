import type { IChatModel, IConfigResponse } from '@/models';

export interface ChatModelAccess {
  allowed: boolean;
  reason?: 'holder_required' | 'config_unavailable';
}

export function resolveChatModelAccess(model: IChatModel, config?: IConfigResponse): ChatModelAccess {
  if (!model.earlyAccessFeature) return { allowed: true };
  if (!config?.features) return { allowed: false, reason: 'config_unavailable' };
  return config.features[model.earlyAccessFeature as keyof typeof config.features] === true
    ? { allowed: true }
    : { allowed: false, reason: 'holder_required' };
}
