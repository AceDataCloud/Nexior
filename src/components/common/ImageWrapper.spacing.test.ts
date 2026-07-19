import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

const TASKS_WITH_SPACED_OPERATIONS = ['flux', 'nanobanana', 'openaiimage', 'qrart', 'seedream'] as const;

describe('ImageWrapper spacing ownership', () => {
  it('does not own external layout spacing', () => {
    const source = readSource('./ImageWrapper.vue');
    const wrapperRule = source.match(/\.image-wrapper\s*\{(?<rule>[\s\S]*?)\n\s*\.image\s*\{/u)?.groups?.rule;

    expect(wrapperRule).toBeDefined();
    expect(wrapperRule).not.toMatch(/\bmargin(?:-bottom)?\s*:/u);
  });

  it('keeps the Midjourney image-to-actions boundary caller-owned', () => {
    const source = readSource('../midjourney/tasks/TaskItem.vue');
    const imagineResultImage = source.match(
      /<image-wrapper\s+v-if="modelValue\?\.response\?\.raw_image_url"(?<markup>[\s\S]*?)\/>/u
    )?.groups?.markup;

    expect(imagineResultImage).toBeDefined();
    expect(imagineResultImage).toContain('class="mb-4"');
  });

  it.each(TASKS_WITH_SPACED_OPERATIONS)('%s owns its result-to-actions gap', (family) => {
    const source = readSource(`../${family}/task/Preview.vue`);

    expect(source).toMatch(/<image-wrapper[\s\S]*?<div :class="\{ operations: true, 'mt-2': true,/u);
  });

  it('keeps Seedance last-frame spacing on the parent result block', () => {
    const source = readSource('../seedance/task/Preview.vue');

    expect(source).toMatch(
      /<div v-if="video\?\.last_frame_url" class="mb-4">\s*<image-wrapper[^>]*video\?\.last_frame_url[^>]*\/>/u
    );
  });
});
