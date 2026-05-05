import { CHAT_MODEL_ICON_CHATGPT } from './chat';

export const OPENAIIMAGE_SERVICE_ID = '06f2acb7-e4d4-43de-9909-76e27b4e2355';
export const OPENAIIMAGE_LOGO = CHAT_MODEL_ICON_CHATGPT;

export const OPENAIIMAGE_MODEL_GPT_IMAGE_1 = 'gpt-image-1';
export const OPENAIIMAGE_MODEL_GPT_IMAGE_15 = 'gpt-image-1.5';
export const OPENAIIMAGE_MODEL_GPT_IMAGE_2 = 'gpt-image-2';

export const OPENAIIMAGE_DEFAULT_MODEL = OPENAIIMAGE_MODEL_GPT_IMAGE_2;

// Common 1K presets (shared across all models)
export const OPENAIIMAGE_SIZE_1024 = '1024x1024';
export const OPENAIIMAGE_SIZE_1536_1024 = '1536x1024';
export const OPENAIIMAGE_SIZE_1024_1536 = '1024x1536';

// gpt-image-2 extra 1K presets
export const OPENAIIMAGE_SIZE_1792_1024 = '1792x1024';
export const OPENAIIMAGE_SIZE_1024_1792 = '1024x1792';

// gpt-image-2 2K presets (billed at "other" 1.5x tier)
export const OPENAIIMAGE_SIZE_2048_2048 = '2048x2048';
export const OPENAIIMAGE_SIZE_2048_1536 = '2048x1536';
export const OPENAIIMAGE_SIZE_1536_2048 = '1536x2048';
export const OPENAIIMAGE_SIZE_2048_1152 = '2048x1152';
export const OPENAIIMAGE_SIZE_1152_2048 = '1152x2048';

// gpt-image-2 4K presets (billed at "other" 1.5x tier)
export const OPENAIIMAGE_SIZE_2880_2880 = '2880x2880';
export const OPENAIIMAGE_SIZE_3264_2448 = '3264x2448';
export const OPENAIIMAGE_SIZE_2448_3264 = '2448x3264';
export const OPENAIIMAGE_SIZE_3840_2160 = '3840x2160';
export const OPENAIIMAGE_SIZE_2160_3840 = '2160x3840';

export const OPENAIIMAGE_DEFAULT_SIZE = OPENAIIMAGE_SIZE_1024;

// Per-model preset lists. Mirrors the OpenAPI `size` description on
// `/openai/images/generations` and `/openai/images/edits`.
export const OPENAIIMAGE_SIZES_GPT_IMAGE_1: string[] = [
  OPENAIIMAGE_SIZE_1024,
  OPENAIIMAGE_SIZE_1536_1024,
  OPENAIIMAGE_SIZE_1024_1536
];

export const OPENAIIMAGE_SIZES_GPT_IMAGE_15: string[] = [
  OPENAIIMAGE_SIZE_1024,
  OPENAIIMAGE_SIZE_1536_1024,
  OPENAIIMAGE_SIZE_1024_1536
];

// gpt-image-2 1K group → 0.2 credits/image
export const OPENAIIMAGE_SIZES_GPT_IMAGE_2_1K: string[] = [
  OPENAIIMAGE_SIZE_1024,
  OPENAIIMAGE_SIZE_1536_1024,
  OPENAIIMAGE_SIZE_1024_1536,
  OPENAIIMAGE_SIZE_1792_1024,
  OPENAIIMAGE_SIZE_1024_1792
];

// gpt-image-2 2K group → 0.3 credits/image (1.5x tier)
export const OPENAIIMAGE_SIZES_GPT_IMAGE_2_2K: string[] = [
  OPENAIIMAGE_SIZE_2048_2048,
  OPENAIIMAGE_SIZE_2048_1536,
  OPENAIIMAGE_SIZE_1536_2048,
  OPENAIIMAGE_SIZE_2048_1152,
  OPENAIIMAGE_SIZE_1152_2048
];

// gpt-image-2 4K group → 0.3 credits/image (1.5x tier)
export const OPENAIIMAGE_SIZES_GPT_IMAGE_2_4K: string[] = [
  OPENAIIMAGE_SIZE_2880_2880,
  OPENAIIMAGE_SIZE_3264_2448,
  OPENAIIMAGE_SIZE_2448_3264,
  OPENAIIMAGE_SIZE_3840_2160,
  OPENAIIMAGE_SIZE_2160_3840
];

export const OPENAIIMAGE_SIZES_GPT_IMAGE_2: string[] = [
  ...OPENAIIMAGE_SIZES_GPT_IMAGE_2_1K,
  ...OPENAIIMAGE_SIZES_GPT_IMAGE_2_2K,
  ...OPENAIIMAGE_SIZES_GPT_IMAGE_2_4K
];

export const OPENAIIMAGE_MODEL_SIZES: Record<string, string[]> = {
  [OPENAIIMAGE_MODEL_GPT_IMAGE_1]: OPENAIIMAGE_SIZES_GPT_IMAGE_1,
  [OPENAIIMAGE_MODEL_GPT_IMAGE_15]: OPENAIIMAGE_SIZES_GPT_IMAGE_15,
  [OPENAIIMAGE_MODEL_GPT_IMAGE_2]: OPENAIIMAGE_SIZES_GPT_IMAGE_2
};

// Models that allow arbitrary WIDTHxHEIGHT (subject to validation).
export const OPENAIIMAGE_CUSTOM_SIZE_MODELS: string[] = [OPENAIIMAGE_MODEL_GPT_IMAGE_2];

// Custom-size validation constants for gpt-image-2. Mirrors upstream constraints
// documented in the OpenAPI `size` description: multiples of 16, longer side
// ≤ 3840, total pixels ≤ 8,294,400.
export const OPENAIIMAGE_CUSTOM_SIZE_MULTIPLE = 16;
export const OPENAIIMAGE_CUSTOM_SIZE_MIN = 256;
export const OPENAIIMAGE_CUSTOM_SIZE_MAX = 3840;
export const OPENAIIMAGE_CUSTOM_SIZE_MAX_PIXELS = 8294400;
