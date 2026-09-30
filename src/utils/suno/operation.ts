import type { ISunoConfig } from '@/models';

export function clearSunoOperation(config?: ISunoConfig): ISunoConfig {
  return {
    ...config,
    action: undefined,
    audio: undefined,
    audio_id: undefined,
    audio_urls: undefined,
    mashup_audio_ids: undefined,
    persona_id: undefined,
    custom_model_id: undefined,
    continue_at: undefined,
    speed: undefined,
    replace_section_start: undefined,
    replace_section_end: undefined,
    overpainting_start: undefined,
    overpainting_end: undefined,
    underpainting_start: undefined,
    underpainting_end: undefined,
    samples_start: undefined,
    samples_end: undefined
  };
}
