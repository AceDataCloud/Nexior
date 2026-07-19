import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const IMAGE_TASK_PREVIEWS = ['flux', 'seedream', 'nanobanana', 'openaiimage', 'qrart'] as const;

const readPreview = (family: (typeof IMAGE_TASK_PREVIEWS)[number]): string =>
  readFileSync(fileURLToPath(new URL(`./${family}/task/Preview.vue`, import.meta.url)), 'utf8');

const getTaskGap = (source: string): string | undefined => {
  const rootDeclarations = source.match(/(?:^|\n)\.preview\s*\{([\s\S]*?)\n\s*\.left\s*\{/)?.[1];
  return rootDeclarations?.match(/margin-bottom:\s*(\d+px);/)?.[1];
};

describe('image task preview spacing', () => {
  it.each(IMAGE_TASK_PREVIEWS)('%s uses the shared inter-item gap', (family) => {
    expect(getTaskGap(readPreview(family))).toBe('10px');
  });
});
