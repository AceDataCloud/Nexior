import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string): string =>
  readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8');

const RIGHT_ALIGNED_UPLOAD_FIELDS = [
  './grokvideo/config/ReferenceImagesInput.vue',
  './nanobanana/config/ImageUrlsInput.vue',
  './omni/config/ReferenceImagesInput.vue',
  './omni/config/VideoInput.vue',
  './openaiimage/config/ImageUrlsInput.vue'
] as const;

describe('scenario upload layout', () => {
  it.each(RIGHT_ALIGNED_UPLOAD_FIELDS)('%s keeps help with the label and the action on the right', (path) => {
    const source = readSource(path);
    const uploadStart = source.indexOf('<el-upload');

    expect(source).toContain('class="field');
    expect(source).toContain('w-full');
    expect(source).toContain('justify-between');
    expect(source).toContain('class="value shrink-0"');
    expect(source.slice(0, uploadStart)).toContain('<info-icon');
  });

  it('keeps Pika previews below its full-width upload header', () => {
    const source = readSource('./pika/config/ImageUrlInput.vue');

    expect(source).toContain(':show-file-list="false"');
    expect(source).toContain(':on-change="onChange"');
    expect(source).toContain('class="value shrink-0"');
    expect(source).toContain('<div v-if="fileList.length" class="file-list mt-2 flex flex-wrap gap-[10px]">');
    expect(source).toContain('<image-preview');
    expect(source).toContain('URL.revokeObjectURL(file.url)');
    expect(source).not.toContain('grid-template-columns');
    expect(source).not.toContain('list-type="picture"');
  });
});
