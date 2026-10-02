// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { h, nextTick, ref } from 'vue';

const boundary = vi.hoisted(() => ({ loaded: false }));
vi.mock('./SharedMarkdown.vue', async (original) => {
  boundary.loaded = true;
  return original();
});

describe('Markdown loading boundary', () => {
  it('keeps the engine unloaded until Markdown is mounted, then renders the real component', async () => {
    const { default: VueMarkdown } = await import('./VueMarkdown.vue');
    const visible = ref(false);
    const wrapper = mount({
      render: () => (visible.value ? h(VueMarkdown, { source: '**loaded**' }) : h('p', 'No Markdown'))
    });
    expect(boundary.loaded).toBe(false);
    expect(wrapper.text()).toBe('No Markdown');
    visible.value = true;
    await nextTick();
    await vi.dynamicImportSettled();
    await flushPromises();
    expect(boundary.loaded).toBe(true);
    expect(wrapper.find('strong').text()).toBe('loaded');
    wrapper.unmount();
  });
});
