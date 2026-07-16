import { describe, expect, it } from 'vitest';
import { clearKlingConflicts, findKlingConflicts, getKlingCapabilities } from './capabilities';

describe('Kling Omni capabilities', () => {
  it('exposes reference video for the canonical model name', () => {
    expect(getKlingCapabilities('kling-o1').referenceVideo).toBe(true);
  });

  it('exposes image and video references for V3 Omni', () => {
    expect(getKlingCapabilities('kling-v3-omni')).toMatchObject({
      referenceImages: true,
      referenceVideo: true
    });
  });

  it('clears prompt controls when switching to O1', () => {
    const config = {
      model: 'kling-v3',
      cfg_scale: 0.5,
      negative_prompt: 'blur',
      camera_control: { type: 'simple' }
    };
    const conflicts = findKlingConflicts(config, { model: 'kling-o1' });
    expect(conflicts.map(({ field }) => field)).toEqual(['camera_control', 'cfg_scale', 'negative_prompt']);
    expect(clearKlingConflicts({ ...config, model: 'kling-o1' }, conflicts)).toMatchObject({
      camera_control: undefined,
      cfg_scale: undefined,
      negative_prompt: undefined
    });
  });
});
