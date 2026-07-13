import { IMaestroConfig, IMaestroGenerateRequest, IMaestroTask } from '@/models';
import {
  MAESTRO_ACTION_REMIX,
  MAESTRO_ALLOWED_SCENARIOS,
  MAESTRO_ALLOWED_VOICES,
  MAESTRO_DEFAULT_SCENARIO,
  MAESTRO_DEFAULT_STYLE,
  MAESTRO_DEFAULT_VOICE
} from '@/constants';

const explicitValue = (value: string | undefined): string | undefined => {
  const normalized = value?.trim();
  return normalized && normalized.toLowerCase() !== 'auto' ? normalized : undefined;
};

const FISH_REFERENCE_ID = /^[0-9a-f]{32}$/;

export function normalizeMaestroConfig(config?: IMaestroConfig): IMaestroConfig {
  const source = config ?? {};
  const {
    customization_enabled: legacyCustomizationEnabled,
    scenario_customization_enabled: scenarioFlag,
    style_customization_enabled: styleFlag,
    voice_customization_enabled: voiceFlag,
    scenario: rawScenario,
    style: rawStyle,
    voice: rawVoice,
    ...rest
  } = source;
  const scenario = explicitValue(rawScenario)?.toLowerCase();
  const style = explicitValue(rawStyle);
  const voice = explicitValue(rawVoice)?.toLowerCase();
  const validScenario = scenario && MAESTRO_ALLOWED_SCENARIOS.includes(scenario) ? scenario : undefined;
  const validStyle = style;
  const validVoice =
    voice && (MAESTRO_ALLOWED_VOICES.some((option) => option.key === voice) || FISH_REFERENCE_ID.test(voice))
      ? voice
      : undefined;
  const hasLegacyFlag = typeof legacyCustomizationEnabled === 'boolean';
  const legacyEnabled = legacyCustomizationEnabled === true;
  const scenarioEnabled = scenarioFlag ?? (hasLegacyFlag ? legacyEnabled && !!validScenario : !!validScenario);
  const styleEnabled = styleFlag ?? (hasLegacyFlag ? legacyEnabled && !!validStyle : !!validStyle);
  const voiceEnabled = voiceFlag ?? (hasLegacyFlag ? legacyEnabled && !!validVoice : !!validVoice);

  return {
    ...rest,
    scenario_customization_enabled: scenarioEnabled,
    style_customization_enabled: styleEnabled,
    voice_customization_enabled: voiceEnabled,
    ...(scenarioEnabled ? { scenario: validScenario ?? MAESTRO_DEFAULT_SCENARIO } : {}),
    ...(styleEnabled ? { style: validStyle ?? MAESTRO_DEFAULT_STYLE } : {}),
    ...(voiceEnabled ? { voice: validVoice ?? MAESTRO_DEFAULT_VOICE } : {})
  };
}

export function buildMaestroRemixConfig(config: IMaestroConfig | undefined, task: IMaestroTask): IMaestroConfig {
  const request = task.request;
  return normalizeMaestroConfig({
    ...(config || {}),
    action: MAESTRO_ACTION_REMIX,
    ref_task_id: task.id,
    prompt: '',
    langs: request?.langs?.length ? request.langs : config?.langs,
    aspect: request?.aspect ?? config?.aspect,
    duration: request?.duration ?? config?.duration,
    scenario_customization_enabled: undefined,
    style_customization_enabled: undefined,
    voice_customization_enabled: undefined,
    scenario: request?.scenario,
    style: request?.style,
    voice: request?.voice,
    file_urls: explicitValue(request?.scenario)?.toLowerCase() === 'captions' ? request?.file_urls || [] : []
  });
}

export function buildMaestroGenerateRequest(config?: IMaestroConfig): IMaestroGenerateRequest {
  const source = normalizeMaestroConfig(config);
  const {
    scenario_customization_enabled: scenarioCustomizationEnabled,
    style_customization_enabled: styleCustomizationEnabled,
    voice_customization_enabled: voiceCustomizationEnabled,
    scenario,
    style,
    voice,
    ...request
  } = source;

  return {
    ...request,
    ...(scenarioCustomizationEnabled && scenario ? { scenario } : {}),
    ...(styleCustomizationEnabled && style ? { style } : {}),
    ...(voiceCustomizationEnabled && voice ? { voice } : {})
  };
}
