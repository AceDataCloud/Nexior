import { IMaestroConfig, IMaestroGenerateRequest } from '@/models';

export function buildMaestroGenerateRequest(config?: IMaestroConfig): IMaestroGenerateRequest {
  const source = config ?? {};
  const { customization_enabled: customizationEnabled, scenario, style, voice, ...request } = source;

  if (!customizationEnabled) return request;

  return {
    ...request,
    ...(scenario !== undefined ? { scenario } : {}),
    ...(style !== undefined ? { style } : {}),
    ...(voice !== undefined ? { voice } : {})
  };
}
