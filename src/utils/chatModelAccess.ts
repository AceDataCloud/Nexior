import type { IChatModel, IConfigResponse } from '@/models';

export interface ChatModelAccess {
  allowed: boolean;
  phase: 'general' | 'disabled' | 'scheduled' | 'holder_access' | 'general_availability' | 'checking';
  reason?: string;
  gaAt?: string;
  minimumTier?: number;
}

export function resolveChatModelAccess(model: IChatModel, config?: IConfigResponse, now = Date.now()): ChatModelAccess {
  if (!model.earlyAccessFeature) return { allowed: true, phase: 'general' };
  const detail = config?.early_access?.[model.name];
  if (!detail || !config?.server_time) return { allowed: false, phase: 'checking', reason: 'config_unavailable' };
  if (detail.phase === 'disabled') return { allowed: false, phase: 'disabled', reason: 'disabled', gaAt: detail.ga_at };

  const serverAtFetch = Date.parse(config.server_time);
  const receivedAt = config.client_received_at;
  const gaAt = detail.ga_at ? Date.parse(detail.ga_at) : Number.NaN;
  const effectiveNow =
    Number.isFinite(serverAtFetch) && typeof receivedAt === 'number'
      ? serverAtFetch + Math.max(0, now - receivedAt)
      : Number.NaN;
  if (Number.isFinite(gaAt) && Number.isFinite(effectiveNow) && effectiveNow >= gaAt) {
    return { allowed: true, phase: 'general_availability', gaAt: detail.ga_at };
  }
  return {
    allowed: detail.eligible,
    phase: detail.phase,
    reason: detail.reason,
    gaAt: detail.ga_at,
    minimumTier: detail.minimum_ace_tier
  };
}
