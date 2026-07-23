import { ISeedanceConfig, ISeedanceGenerateRequest, ISeedanceImageInput } from '@/models';
import { getSeedanceCapability, SEEDANCE_MODEL_CAPABILITIES } from '@/constants';

// Mirrors the keys of SEEDANCE_MODEL_CAPABILITIES for a cheap membership check.
const KNOWN_MODELS = new Set(Object.keys(SEEDANCE_MODEL_CAPABILITIES));

/**
 * Normalize a Seedance config into the exact request sent to /seedance/videos.
 *
 * Centralizes the per-model capability gating that used to live inline in the
 * studio page. Returns a reject reason (mapped to a localized warning) when the
 * config can't produce a valid request, else the request with async:true.
 */
export type SeedanceRejectReason =
  | 'modelUnsupported'
  | 'modelRequiresImage'
  | 'modelRejectsImage'
  | 'audioRequiresReference';

export interface SeedanceNormalizeResult {
  request?: ISeedanceGenerateRequest;
  reject?: SeedanceRejectReason;
}

const cleanImages = (images: unknown): ISeedanceImageInput[] =>
  Array.isArray(images) ? (images as ISeedanceImageInput[]).filter((img) => !!img?.url) : [];

export function normalizeSeedanceRequest(config?: ISeedanceConfig): SeedanceNormalizeResult {
  const cfg: any = { ...(config || {}) };

  if (typeof cfg.prompt === 'string') {
    cfg.prompt = cfg.prompt.trim();
    if (!cfg.prompt) delete cfg.prompt;
  }

  // Unknown model → reject early with an inline warning instead of an opaque
  // upstream "model X is not supported" error.
  if (cfg.model && !KNOWN_MODELS.has(cfg.model)) {
    return { reject: 'modelUnsupported' };
  }
  const cap = getSeedanceCapability(cfg.model);

  // Filter empty images; promote a lone last_frame to first_frame.
  cfg.images = cleanImages(cfg.images);
  const hasFirstFrame = cfg.images.some((img: ISeedanceImageInput) => img.role === 'first_frame');
  const hasLastFrame = cfg.images.some((img: ISeedanceImageInput) => img.role === 'last_frame');
  if (!hasFirstFrame && hasLastFrame) {
    cfg.images = cfg.images.map((img: ISeedanceImageInput) =>
      img.role === 'last_frame' ? { ...img, role: 'first_frame' as const } : img
    );
  }
  let hasImages = cfg.images.length > 0;
  if (!hasImages) delete cfg.images;

  // Never send the Ark "flex" tier: it queues on the batch pipeline far past the
  // worker poll window (=> "timeout when generating video") with no price benefit.
  delete cfg.service_tier;

  // A text-only model with any image is a user mistake worth surfacing before we
  // start stripping roles below (which would otherwise hide it).
  if (!cap.acceptsImage && hasImages) return { reject: 'modelRejectsImage' };

  if (!cap.acceptsAudio && cfg.generate_audio) cfg.generate_audio = false;
  if (!cap.acceptsReturnLastFrame && cfg.return_last_frame) cfg.return_last_frame = false;
  if (!cap.acceptsLastFrame && hasImages) {
    cfg.images = cfg.images.filter((img: ISeedanceImageInput) => img.role !== 'last_frame');
    hasImages = cfg.images.length > 0;
    if (!hasImages) delete cfg.images;
  }

  // Reference media (Seedance 2.0 multimodal): keep valid urls, drop when the
  // model doesn't accept that reference type.
  if (cap.acceptsReferenceAudio && Array.isArray(cfg.audios)) {
    cfg.audios = cfg.audios.filter((a: any) => a?.url);
  }
  if (!cap.acceptsReferenceAudio || !Array.isArray(cfg.audios) || cfg.audios.length === 0) {
    delete cfg.audios;
  }
  if (cap.acceptsReferenceVideo && Array.isArray(cfg.videos)) {
    cfg.videos = cfg.videos.filter((v: any) => v?.url);
  }
  if (!cap.acceptsReferenceVideo || !Array.isArray(cfg.videos) || cfg.videos.length === 0) {
    delete cfg.videos;
  }
  if (!cap.acceptsReferenceImage && Array.isArray(cfg.images)) {
    cfg.images = cfg.images.filter((img: ISeedanceImageInput) => img.role !== 'reference_image');
    if (cfg.images.length === 0) delete cfg.images;
  }
  hasImages = Array.isArray(cfg.images) && cfg.images.length > 0;

  // Validate image presence only AFTER role stripping — an image the model can't
  // use (e.g. a stray reference_image) must not satisfy a hard image requirement,
  // else we submit an image-less request and take a 400 upstream.
  if (cap.requiresImage && !hasImages) return { reject: 'modelRequiresImage' };
  if (!cap.acceptsText && !hasImages) return { reject: 'modelRequiresImage' };

  // Reference audio is a multimodal companion, never a standalone input: the
  // official combos are 图片+音频 / 视频+音频 / 图片+视频+音频 (纯音频 and 文本+音频
  // are rejected upstream). Require a paired image or video reference.
  const hasVideo = Array.isArray(cfg.videos) && cfg.videos.length > 0;
  if (Array.isArray(cfg.audios) && cfg.audios.length > 0 && !hasImages && !hasVideo) {
    return { reject: 'audioRequiresReference' };
  }

  return { request: { ...cfg, async: true } as ISeedanceGenerateRequest };
}
