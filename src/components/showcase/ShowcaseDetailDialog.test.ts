// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ResolvedShowcase } from '@/models';
import ShowcaseDetailDialog from './ShowcaseDetailDialog.vue';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRouter: () => ({ push: mocks.push })
}));
vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { props: ['src'], template: '<div class="video-player" />' }
}));
vi.mock('./ShowcaseAudioPlayer.vue', () => ({
  default: { props: ['src', 'cover', 'title'], template: '<div class="audio-player" />' }
}));
vi.mock('@acedatacloud/core/icons/components', () => ({
  CloseIcon: { template: '<svg class="close-icon" />' }
}));

let resizeCallback: ResizeObserverCallback;
class ResizeObserverStub {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

const baseItem: ResolvedShowcase = {
  id: '196387e7-f217-453f-a678-ed1165e0cbd9',
  service: 'nano-banana',
  capability: 'nanobanana',
  routeName: 'nanobanana-index',
  name: 'Nano Banana',
  description: 'An origami orchard at dawn',
  icon: 'nano.png',
  defaultIcon: 'nano.png',
  title: 'Origami Orchard',
  altText: 'An origami orchard at dawn',
  mediaType: 'Image',
  posterUrl: 'image.webp',
  previewUrl: '',
  layout: 'Portrait',
  prompt: 'An origami orchard at dawn',
  model: 'gemini-2.5-flash-image',
  canCreateSimilar: true,
  parameters: [
    { key: 'aspect_ratio', value: '3:4' },
    { key: 'seed', value: '42' }
  ]
};

function mountDialog(item: ResolvedShowcase) {
  return mount(ShowcaseDetailDialog, {
    props: { item },
    global: {
      stubs: {
        ElDialog: {
          name: 'ElDialog',
          props: ['modelValue', 'showClose', 'width', 'title', 'id'],
          emits: ['close', 'closed', 'update:modelValue'],
          template: '<div v-if="modelValue" class="dialog-stub" :id="id"><slot /></div>'
        },
        VideoPlayer: { props: ['src'], template: '<div class="video-player" />' },
        ShowcaseAudioPlayer: { props: ['src', 'cover', 'title'], template: '<div class="audio-player" />' }
      },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('ShowcaseDetailDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.push.mockResolvedValue(undefined);
    vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  });

  it('shows the image brief, layout, and safe parameters', () => {
    const wrapper = mountDialog(baseItem);

    expect(wrapper.get('.detail-layout').classes()).toContain('layout-portrait');
    expect(wrapper.get('.media-stage > img').attributes('src')).toBe('image.webp');
    expect(wrapper.get('.prompt').text()).toContain(baseItem.prompt);
    expect(wrapper.get('.service-copy').find('.service-name').text()).toBe(baseItem.name);
    expect(wrapper.get('.service-copy').find('.model').text()).toBe(baseItem.model);
    expect(wrapper.findAll('.parameters dt').map((node) => node.text())).toEqual(['Aspect ratio', 'Seed']);
  });

  it('navigates to recreate the item and closes the detail Dialog', async () => {
    const wrapper = mountDialog(baseItem);

    await wrapper.get('.create-similar').trigger('click');

    expect(mocks.push).toHaveBeenCalledWith({
      name: 'nanobanana-index',
      query: { showcase: baseItem.id }
    });
    expect(wrapper.emitted('close')).toHaveLength(1);
  });

  it('does not expose or execute Create similar for display-only items', async () => {
    const wrapper = mountDialog({ ...baseItem, canCreateSimilar: false, prompt: '', parameters: [] });
    expect(wrapper.find('.create-similar').exists()).toBe(false);
    await (wrapper.vm as any).createSimilar();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(wrapper.emitted('close')).toBeUndefined();
  });

  it('uses a lightweight custom close button while preserving the Dialog close event', async () => {
    const wrapper = mountDialog(baseItem);
    const dialog = wrapper.getComponent({ name: 'ElDialog' });
    expect(dialog.props('showClose')).toBe(false);
    expect(wrapper.get('.detail-close').attributes('aria-label')).toBe('common.button.close');
    expect(wrapper.find('.close-icon').exists()).toBe(true);

    await wrapper.get('.detail-close').trigger('click');
    expect(wrapper.emitted('close')).toHaveLength(1);
    dialog.vm.$emit('close');
    expect(wrapper.emitted('close')).toHaveLength(2);
  });

  it('opens long prompts in an independently scrollable Dialog', async () => {
    const longPrompt = 'Long prompt '.repeat(120);
    const wrapper = mountDialog({ ...baseItem, prompt: longPrompt });
    const prompt = wrapper.get('.prompt p').element;
    Object.defineProperties(prompt, {
      scrollHeight: { configurable: true, value: 240 },
      clientHeight: { configurable: true, value: 120 }
    });
    resizeCallback([], {} as ResizeObserver);
    await wrapper.vm.$nextTick();

    const toggle = wrapper.get('.prompt-toggle');
    expect(wrapper.get('.prompt p').classes()).toContain('collapsed');
    expect(toggle.attributes('aria-haspopup')).toBe('dialog');
    expect(toggle.attributes('aria-controls')).toBe(`showcase-prompt-dialog-${baseItem.id}`);
    expect(wrapper.find('.full-prompt').exists()).toBe(false);

    const focus = vi.spyOn(toggle.element as HTMLButtonElement, 'focus');
    await toggle.trigger('click');
    expect(wrapper.get('.prompt p').classes()).toContain('collapsed');
    expect(wrapper.get('.full-prompt').text()).toBe(longPrompt.trim());
    expect(wrapper.findAll('.dialog-stub')).toHaveLength(2);

    const promptDialog = wrapper.findAllComponents({ name: 'ElDialog' })[1];
    promptDialog.vm.$emit('update:modelValue', false);
    promptDialog.vm.$emit('closed');
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.full-prompt').exists()).toBe(false);
    expect(focus).toHaveBeenCalledOnce();
    expect(wrapper.find('.detail-layout').exists()).toBe(true);
  });

  it('closes the full-prompt Dialog when the selected item changes', async () => {
    const wrapper = mountDialog({ ...baseItem, prompt: 'Long prompt '.repeat(120) });
    const prompt = wrapper.get('.prompt p').element;
    Object.defineProperties(prompt, {
      scrollHeight: { configurable: true, value: 240 },
      clientHeight: { configurable: true, value: 120 }
    });
    resizeCallback([], {} as ResizeObserver);
    await wrapper.vm.$nextTick();
    await wrapper.get('.prompt-toggle').trigger('click');
    expect(wrapper.find('.full-prompt').exists()).toBe(true);

    await wrapper.setProps({ item: { ...baseItem, id: 'next-item', title: 'Next item' } });
    expect(wrapper.find('.full-prompt').exists()).toBe(false);
    expect(wrapper.find('.detail-layout').exists()).toBe(true);
  });

  it('does not show disclosure for a short prompt', async () => {
    const wrapper = mountDialog(baseItem);
    const prompt = wrapper.get('.prompt p').element;
    Object.defineProperties(prompt, {
      scrollHeight: { configurable: true, value: 80 },
      clientHeight: { configurable: true, value: 80 }
    });
    resizeCallback([], {} as ResizeObserver);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.prompt-toggle').exists()).toBe(false);
  });

  it('uses the shared player for video without rendering the image branch', () => {
    const item = {
      ...baseItem,
      mediaType: 'Video' as const,
      layout: 'Landscape' as const,
      posterUrl: 'poster.webp',
      previewUrl: 'clip.mp4'
    };
    const wrapper = mountDialog(item);

    expect(wrapper.get('.detail-layout').classes()).toContain('layout-landscape');
    expect((wrapper.getComponent('.video-player') as any).props('src')).toBe('clip.mp4');
    expect(wrapper.find('.media-stage > img').exists()).toBe(false);
  });

  it('uses an isolated player for audio', () => {
    const item = {
      ...baseItem,
      mediaType: 'Audio' as const,
      layout: 'Square' as const,
      posterUrl: 'cover.webp',
      previewUrl: 'track.mp3',
      title: 'Amber Nocturne'
    };
    const wrapper = mountDialog(item);

    expect(wrapper.get('.detail-layout').classes()).toContain('media-audio');
    expect((wrapper.getComponent('.audio-player') as any).props()).toMatchObject({
      src: 'track.mp3',
      cover: 'cover.webp',
      title: 'Amber Nocturne'
    });
  });
});
