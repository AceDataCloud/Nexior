import {
  SEEDREAM_MODEL_4_0,
  SEEDREAM_MODEL_4_5,
  SEEDREAM_MODEL_5_0,
  SEEDREAM_MODEL_5_0_PRO,
  SEEDREAM_SIZE_1_5K,
  SEEDREAM_SIZE_1K,
  SEEDREAM_SIZE_2K,
  SEEDREAM_SIZE_3K,
  SEEDREAM_SIZE_4K
} from '@/constants';

export interface ISeedreamCapability {
  image: boolean;
  imageRequired: boolean;
  maxInputImages: number;
  sizeTiers: string[];
  sizePixel: boolean;
  sizeAdaptive: boolean;
  sizePixelDefault?: string;
  groupGeneration: boolean;
  seed: boolean;
  guidanceScale: boolean;
  guidanceScaleDefault?: number;
  outputFormat: boolean;
  webSearch: boolean;
  promptOptimization: Array<'standard' | 'fast'>;
  layerDecomposition: boolean;
  transparentBackground: boolean;
}

const FALLBACK: ISeedreamCapability = {
  image: true,
  imageRequired: false,
  maxInputImages: 14,
  sizeTiers: [SEEDREAM_SIZE_1K, SEEDREAM_SIZE_2K, SEEDREAM_SIZE_4K],
  sizePixel: true,
  sizeAdaptive: false,
  sizePixelDefault: undefined,
  groupGeneration: false,
  seed: false,
  guidanceScale: false,
  outputFormat: false,
  webSearch: false,
  promptOptimization: [],
  layerDecomposition: false,
  transparentBackground: false
};

export function getSeedreamCapabilities(model?: string): ISeedreamCapability {
  switch (model) {
    case SEEDREAM_MODEL_5_0_PRO:
      return {
        image: true,
        imageRequired: false,
        maxInputImages: 10,
        sizeTiers: [SEEDREAM_SIZE_1K, SEEDREAM_SIZE_1_5K, SEEDREAM_SIZE_2K],
        sizePixel: true,
        sizeAdaptive: false,
        sizePixelDefault: undefined,
        groupGeneration: false,
        seed: false,
        guidanceScale: false,
        outputFormat: true,
        webSearch: false,
        promptOptimization: ['standard', 'fast'],
        layerDecomposition: true,
        transparentBackground: true
      };
    case SEEDREAM_MODEL_5_0:
      return {
        image: true,
        imageRequired: false,
        maxInputImages: 14,
        sizeTiers: [SEEDREAM_SIZE_2K, SEEDREAM_SIZE_3K, SEEDREAM_SIZE_4K],
        sizePixel: true,
        sizeAdaptive: false,
        sizePixelDefault: undefined,
        groupGeneration: true,
        seed: false,
        guidanceScale: false,
        outputFormat: true,
        webSearch: true,
        promptOptimization: ['standard'],
        layerDecomposition: false,
        transparentBackground: false
      };
    case SEEDREAM_MODEL_4_5:
      return {
        image: true,
        imageRequired: false,
        maxInputImages: 14,
        sizeTiers: [SEEDREAM_SIZE_2K, SEEDREAM_SIZE_4K],
        sizePixel: true,
        sizeAdaptive: false,
        sizePixelDefault: undefined,
        groupGeneration: true,
        seed: false,
        guidanceScale: false,
        outputFormat: false,
        webSearch: false,
        promptOptimization: ['standard'],
        layerDecomposition: false,
        transparentBackground: false
      };
    case SEEDREAM_MODEL_4_0:
      return {
        image: true,
        imageRequired: false,
        maxInputImages: 14,
        sizeTiers: [SEEDREAM_SIZE_1K, SEEDREAM_SIZE_2K, SEEDREAM_SIZE_4K],
        sizePixel: true,
        sizeAdaptive: false,
        sizePixelDefault: undefined,
        groupGeneration: true,
        seed: false,
        guidanceScale: false,
        outputFormat: false,
        webSearch: false,
        promptOptimization: ['standard', 'fast'],
        layerDecomposition: false,
        transparentBackground: false
      };
    default:
      return FALLBACK;
  }
}

export function getCompatibleSeedreamAction(
  action: 'generate' | 'edit' | undefined,
  _model?: string
): 'generate' | 'edit' {
  return action === 'edit' ? 'edit' : 'generate';
}

export function getSeedreamAction(_model?: string, image?: string[]): 'generate' | 'edit' {
  return image?.length ? 'edit' : 'generate';
}

export type SeedreamConflictField =
  | 'image'
  | 'size'
  | 'sequential_image_generation'
  | 'seed'
  | 'guidance_scale'
  | 'output_format'
  | 'tools'
  | 'optimize_prompt_options'
  | 'layer_decomposition'
  | 'background';

export interface ISeedreamConflict {
  field: SeedreamConflictField;
  i18nLabel: string;
}

const TIER_PRESETS = [SEEDREAM_SIZE_1K, SEEDREAM_SIZE_1_5K, SEEDREAM_SIZE_2K, SEEDREAM_SIZE_3K, SEEDREAM_SIZE_4K];

export function findSeedreamConflicts(
  config: Record<string, any> | undefined,
  next: { model?: string }
): ISeedreamConflict[] {
  if (!config) return [];
  const capabilities = getSeedreamCapabilities(next.model ?? config.model);
  const conflicts: ISeedreamConflict[] = [];
  const size = typeof config.size === 'string' ? config.size : undefined;

  if (Array.isArray(config.image) && config.image.length > capabilities.maxInputImages) {
    conflicts.push({ field: 'image', i18nLabel: 'seedream.name.imageUrls' });
  }
  if (size && (size === 'adaptive' || (TIER_PRESETS.includes(size) && !capabilities.sizeTiers.includes(size)))) {
    conflicts.push({ field: 'size', i18nLabel: 'seedream.name.size' });
  }
  if (config.sequential_image_generation === 'auto' && !capabilities.groupGeneration) {
    conflicts.push({ field: 'sequential_image_generation', i18nLabel: 'seedream.name.maxImages' });
  }
  if (config.seed !== undefined) {
    conflicts.push({ field: 'seed', i18nLabel: 'seedream.name.seed' });
  }
  if (config.guidance_scale !== undefined) {
    conflicts.push({ field: 'guidance_scale', i18nLabel: 'seedream.name.guidanceScale' });
  }
  if (config.output_format && !capabilities.outputFormat) {
    conflicts.push({ field: 'output_format', i18nLabel: 'seedream.name.outputFormat' });
  }
  if (config.tools?.length && !capabilities.webSearch) {
    conflicts.push({ field: 'tools', i18nLabel: 'seedream.name.webSearch' });
  }
  const optimizeMode = config.optimize_prompt_options?.mode;
  if (optimizeMode && !capabilities.promptOptimization.includes(optimizeMode)) {
    conflicts.push({ field: 'optimize_prompt_options', i18nLabel: 'seedream.name.promptOptimization' });
  }
  if (config.layer_decomposition && !capabilities.layerDecomposition) {
    conflicts.push({ field: 'layer_decomposition', i18nLabel: 'seedream.name.layerDecomposition' });
  }
  if (config.background && !capabilities.transparentBackground) {
    conflicts.push({ field: 'background', i18nLabel: 'seedream.name.background' });
  }
  return conflicts;
}

export function clearSeedreamConflicts(
  config: Record<string, any>,
  conflicts: ISeedreamConflict[],
  _next: { model?: string }
): Record<string, any> {
  const result = { ...config };
  for (const conflict of conflicts) {
    switch (conflict.field) {
      case 'image':
        result.image = (result.image || []).slice(0, getSeedreamCapabilities(result.model).maxInputImages);
        break;
      case 'size':
        delete result.size;
        break;
      case 'sequential_image_generation':
        result.sequential_image_generation = 'disabled';
        delete result.sequential_image_generation_options;
        break;
      case 'seed':
      case 'guidance_scale':
      case 'output_format':
      case 'tools':
      case 'optimize_prompt_options':
      case 'layer_decomposition':
      case 'background':
        delete result[conflict.field];
        break;
    }
  }
  return result;
}
