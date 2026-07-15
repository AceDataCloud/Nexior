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
  /** camera_control / motion control. NOTE: cross-cutting upstream rule rejects
   *  camera_control whenever start_image_url is set, regardless of this flag —
   *  see findKlingConflicts. */
  motionControl: boolean;
  /** Omni reference video (video_list) — edit/reference an existing video.
   *  Only kling-video-o1 supports it. */
  referenceVideo: boolean;
}

const FALLBACK: IKlingCapability = {
  text2video: true,
  image2video: true,
  endImage: false,
  audio: false,
  motionControl: false,
  referenceVideo: false
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
        motionControl: d === 5,
        referenceVideo: false
      };
    // v1.6 / v2.5-Turbo / v2.6 / v2.1: end-frame is pro-only.
    case 'kling-v1-6':
    case 'kling-v2-5-turbo':
      return {
        text2video: true,
        image2video: true,
        endImage: m === 'pro',
        audio: false,
        motionControl: false,
        referenceVideo: false
      };
    case 'kling-v2-6':
      return {
        text2video: true,
        image2video: true,
        endImage: m === 'pro',
        audio: m === 'pro',
        motionControl: false,
        referenceVideo: false
      };
    // v2-Master / v2.1-Master: single-mode, no end-frame in matrix.
    case 'kling-v2-master':
    case 'kling-v2-1-master':
      return {
        text2video: true,
        image2video: true,
        endImage: false,
        audio: false,
        motionControl: false,
        referenceVideo: false
      };
    // v3 family: end-frame in every mode; motion control on v3 std/pro only.
    case 'kling-v3':
      return {
        text2video: true,
        image2video: true,
        endImage: true,
        audio: true,
        motionControl: m !== '4k',
        referenceVideo: false
      };
    case 'kling-v3-omni':
      return {
        text2video: true,
        image2video: true,
        endImage: true,
        audio: true,
        motionControl: false,
        referenceVideo: false
      };
    case 'kling-video-o1':
      return {
        text2video: true,
        image2video: true,
        endImage: true,
        audio: false,
        motionControl: false,
        referenceVideo: true
      };
    default:
      return FALLBACK;
  }
}

export interface IKlingConflict {
  /** Field name in the config object. */
  field: 'end_image_url' | 'generate_audio' | 'camera_control' | 'video_list';
  /** i18n key for the user-facing label of the field. */
  i18nLabel: string;
}

// The Omni reference video must be cited in the prompt as <<<video_1>>>, or the
// upstream model ignores it. Shared so the uploader and the model-switch
// cleanup remove it consistently.
export const KLING_VIDEO_TOKEN = '<<<video_1>>>';

/** Remove every <<<video_1>>> occurrence and collapse the leftover whitespace. */
export function stripKlingVideoToken(prompt?: string): string {
  if (!prompt) return '';
  return prompt
    .split(KLING_VIDEO_TOKEN)
    .join(' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
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
  // camera_control is rejected by the model matrix and additionally by the
  // upstream worker for any image2video request (start_image_url set).
  if (config.camera_control?.type) {
    if (!caps.motionControl || config.start_image_url) {
      conflicts.push({ field: 'camera_control', i18nLabel: 'kling.name.cameraControl' });
    }
  }
  // Omni reference video (video_list) is only valid on models that advertise it.
  if (config.video_list?.length && !caps.referenceVideo) {
    conflicts.push({ field: 'video_list', i18nLabel: 'kling.name.referenceVideo' });
  }

  return conflicts;
}

/**
 * Apply the conflict resolutions to a config object. Returns a new config with
 * the offending fields cleared.
 */
export function clearKlingConflicts(config: Record<string, any>, conflicts: IKlingConflict[]): Record<string, any> {
  const next = { ...config };
  for (const c of conflicts) {
    if (c.field === 'end_image_url') next.end_image_url = undefined;
    if (c.field === 'generate_audio') next.generate_audio = false;
    if (c.field === 'camera_control') next.camera_control = undefined;
    if (c.field === 'video_list') {
      next.video_list = undefined;
      next.prompt = stripKlingVideoToken(next.prompt);
    }
  }
  return next;
}
