// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import type { ResolvedShowcase } from '@/models';
import InspirationDetailDialog from './InspirationDetailDialog.vue';

vi.mock('@/components/common/VideoPlayer.vue', () => ({
  default: { props: ['src'], template: '<div class="video-player" />' }
}));
vi.mock('./ShowcaseAudioPlayer.vue', () => ({
  default: { props: ['src', 'cover', 'title'], template: '<div class="audio-player" />' }
}));

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
  parameters: [
    { key: 'aspect_ratio', value: '3:4' },
    { key: 'seed', value: '42' }
  ]
};

function mountDialog(item: ResolvedShowcase) {
  return mount(InspirationDetailDialog, {
    props: { item },
    global: {
      stubs: {
        ElDialog: {
          props: ['modelValue'],
          emits: ['close'],
          template: '<div class="dialog-stub"><slot /></div>'
        },
        RouterLink: {
          props: ['to'],
          template: '<a class="router-link"><slot /></a>'
        },
        VideoPlayer: { props: ['src'], template: '<div class="video-player" />' },
        ShowcaseAudioPlayer: { props: ['src', 'cover', 'title'], template: '<div class="audio-player" />' }
      },
      mocks: { $t: (key: string) => key }
    }
  });
}

describe('InspirationDetailDialog', () => {
  it('shows the complete image brief, model, safe parameters, and create-similar destination', () => {
    const wrapper = mountDialog(baseItem);

    expect(wrapper.get('.media-stage > img').attributes('src')).toBe('image.webp');
    expect(wrapper.get('.prompt').text()).toContain(baseItem.prompt);
    expect(wrapper.get('.model').text()).toBe(baseItem.model);
    expect(wrapper.findAll('.parameters dt').map((node) => node.text())).toEqual(['Aspect ratio', 'Seed']);
    expect((wrapper.getComponent('.router-link') as any).props('to')).toEqual({
      name: 'nanobanana-index',
      query: { showcase: baseItem.id }
    });
    expect(wrapper.text()).not.toContain(baseItem.id);
  });

  it('uses the shared player for video without rendering the image branch', () => {
    const item = { ...baseItem, mediaType: 'Video' as const, posterUrl: 'poster.webp', previewUrl: 'clip.mp4' };
    const wrapper = mountDialog(item);

    expect((wrapper.getComponent('.video-player') as any).props('src')).toBe('clip.mp4');
    expect(wrapper.find('.media-stage > img').exists()).toBe(false);
  });

  it('uses an isolated player for audio', () => {
    const item = {
      ...baseItem,
      mediaType: 'Audio' as const,
      posterUrl: 'cover.webp',
      previewUrl: 'track.mp3',
      title: 'Amber Nocturne'
    };
    const wrapper = mountDialog(item);

    expect((wrapper.getComponent('.audio-player') as any).props()).toMatchObject({
      src: 'track.mp3',
      cover: 'cover.webp',
      title: 'Amber Nocturne'
    });
  });
});
