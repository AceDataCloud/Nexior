// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import SizeSelector from './SizeSelector.vue';

const mount = (model: string) =>
  shallowMount(SizeSelector, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state: { seedream: { config: { model } } }, commit: () => undefined }
      }
    }
  });

describe('Seedream size options', () => {
  it('does not offer sub-2K pixel presets to Lite', () => {
    const wrapper = mount('doubao-seedream-5-0-260128');
    const values = (wrapper.vm as any).pixelOptions.map((item: any) => item.value);
    expect(values).not.toContain('1024x1024');
    expect(values).toContain('2048x2048');
  });

  it('keeps 1K pixel presets for Pro', () => {
    const wrapper = mount('doubao-seedream-5-0-pro-260628');
    expect((wrapper.vm as any).pixelOptions.map((item: any) => item.value)).toContain('1024x1024');
  });
});
