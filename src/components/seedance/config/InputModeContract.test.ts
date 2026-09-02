import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (file: string) =>
  readFileSync(resolve(process.cwd(), 'src', 'components', 'seedance', 'config', file), 'utf8');

const frameUploaders = ['FirstFrameImage.vue', 'LastFrameImage.vue'];
const referenceUploaders = ['ReferenceImage.vue', 'ReferenceAudio.vue', 'ReferenceVideo.vue'];

describe('Seedance input-mode upload contract', () => {
  it.each(frameUploaders)('%s blocks frame uploads while reference media exists', (file) => {
    const component = source(file);
    expect(component).toContain(':disabled="uploadDisabled"');
    expect(component).not.toContain(
      '<el-upload\n      ref="uploader"\n      v-model:file-list="fileList"\n      name="file"\n      accept=".png,.jpg,.jpeg,.gif,.bmp,.webp"\n      :disabled'
    );
    expect(component).toContain(':before-upload="onBeforeUpload"');
    expect(component).toContain('dropDisabled(): boolean');
    expect(component).toContain('return this.inputModes.reference;');
    expect(component).toContain('seedance.message.frameUploadBlocked');
  });

  it.each(['FirstFrameImage.vue', 'LastFrameImage.vue', 'ReferenceImage.vue'])(
    '%s synchronizes custom preview removal back to the store',
    (file) => {
      const component = source(file);
      expect(component).toContain('@remove="onRemoveFile(file)"');
      expect(component).toContain('onRemoveFile(file: UploadFile)');
    }
  );

  it.each(referenceUploaders)('%s blocks reference uploads while boundary frames exist', (file) => {
    const component = source(file);
    expect(component).toContain(':disabled="uploadDisabled"');
    expect(component).toContain(':before-upload="onBeforeUpload"');
    expect(component).toContain('dropDisabled(): boolean');
    expect(component).toContain('return this.inputModes.frame;');
    expect(component).toContain('seedance.message.referenceUploadBlocked');
  });

  it('keeps a visible recovery path for restored mixed configurations', () => {
    const panel = readFileSync(resolve(process.cwd(), 'src', 'components', 'seedance', 'ConfigPanel.vue'), 'utf8');
    expect(panel).toContain('v-if="inputModes.mixed"');
    expect(panel).toContain('seedance.message.frameReferenceConflict');
    expect(panel).toContain('input-mode-guide');
  });

  it('exposes the official Seedance 2.5 reference task type', () => {
    expect(source('Advanced25Settings.vue')).toContain('value="reference"');
  });
});
