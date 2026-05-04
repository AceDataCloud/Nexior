// Capability matrix for Kling video models.
//
// Single source of truth derived from the official Kling docs:
// https://app.klingai.com/global/dev/document-api/apiReference/model/videoModels
//
// Used by the Kling config UI to:
//   - decide which features are valid for the current (model, mode, duration)
//   - prompt the user before silently dropping config that is no longer supported

export interface IKlingCapability {
  /** Model accepts the request at all (effectively always true here). */
  text2video: boolean;
  image2video: boolean;
  /** start_image_url + end_image_url combo (image_tail). */
  endImage: boolean;
  /** generate_audio (background sound, not voice/lip-sync). */
  audio: boolean;
  /** camera_control / motion control. */
  motionControl: boolean;
}

const FALLBACK: IKlingCapability = {
  text2video: true,
  image2video: true,
  endImage: false,
  audio: false,
  motionControl: false
};

/**
 * Return the support matrix for a given (model, mode, duration) combo.
 *
 * Mode and duration may be undefined; we default mode to "std" and duration to 5
 * to mirror the upstream worker's defaulting behaviour.
 */
export function getKlingCapabilities(model?: string, mode?: string, duration?: number): IKlingCapability {
  const m = mode || 'std';
  const d = duration ?? 5;
  switch (model) {
    // Legacy v1: only 5s combos support start/end-frame and motion brush.
    case 'kling-v1':
      return {
        text2video: true,
        image2video: true,
        endImage: d === 5,
        audio: false,
        motionControl: d === 5
      };
    // v1.6 / v2.5-Turbo / v2.6 / v2.1: end-frame is pro-only.
    case 'kling-v1-6':
    case 'kling-v2-5-turbo':
      return {
        text2video: true,
        image2video: true,
        endImage: m === 'pro',
        audio: false,
        motionControl: false
      };
    case 'kling-v2-6':
      return {
        text2video: true,
        image2video: true,
        endImage: m === 'pro',
        audio: m === 'pro',
        motionControl: false
      };
    // v2-Master / v2.1-Master: single-mode, no end-frame in matrix.
    case 'kling-v2-master':
    case 'kling-v2-1-master':
      return {
        text2video: true,
        image2video: true,
        endImage: false,
        audio: false,
        motionControl: false
      };
    // v3 family: end-frame in every mode; motion control on v3 std/pro only.
    case 'kling-v3':
      return {
        text2video: true,
        image2video: true,
        endImage: true,
        audio: true,
        motionControl: m !== '4k'
      };
    case 'kling-v3-omni':
      return {
        text2video: true,
        image2video: true,
        endImage: true,
        audio: true,
        motionControl: false
      };
    case 'kling-video-o1':
      return {
        text2video: true,
        image2video: true,
        endImage: true,
        audio: false,
        motionControl: false
      };
    default:
      return FALLBACK;
  }
}

export interface IKlingConflict {
  /** Field name in the config object. */
  field: 'end_image_url' | 'generate_audio' | 'camera_control';
  /** i18n key for the user-facing label of the field. */
  i18nLabel: string;
}

/**
 * Compute which currently-set config fields will be unsupported under the
 * proposed (model, mode, duration) combo.
 */
export function findKlingConflicts(
  config: Record<string, any> | undefined,
  next: { model?: string; mode?: string; duration?: number }
): IKlingConflict[] {
  if (!config) return [];
  const model = next.model ?? config.model;
  const mode = next.mode ?? config.mode;
  const duration = next.duration ?? config.duration;
  if (!model) return [];

  const caps = getKlingCapabilities(model, mode, duration);
  const conflicts: IKlingConflict[] = [];

  if (config.end_image_url && !caps.endImage) {
    conflicts.push({ field: 'end_image_url', i18nLabel: 'kling.name.endImage' });
  }
  if (config.generate_audio && !caps.audio) {
    conflicts.push({ field: 'generate_audio', i18nLabel: 'kling.name.generateAudio' });
  }
  if (config.camera_control?.type && !caps.motionControl) {
    conflicts.push({ field: 'camera_control', i18nLabel: 'kling.name.cameraControl' });
  }

  return conflicts;
}

/**
 * Apply the conflict resolutions to a config object. Returns a new config with
 * the offending fields cleared.
 */
export function clearKlingConflicts(
  config: Record<string, any>,
  conflicts: IKlingConflict[]
): Record<string, any> {
  const next = { ...config };
  for (const c of conflicts) {
    if (c.field === 'end_image_url') next.end_image_url = undefined;
    if (c.field === 'generate_audio') next.generate_audio = false;
    if (c.field === 'camera_control') next.camera_control = undefined;
  }
  return next;
}
