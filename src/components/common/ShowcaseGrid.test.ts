// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ShowcaseGrid from './ShowcaseGrid.vue';
import type { ResolvedShowcase } from '@/models';

const items: ResolvedShowcase[] = [
  {
    id: 'video-id',
    service: 'seedance',
    capability: 'seedance',
    routeName: 'seedance-index',
    name: 'Seedance',
    title: 'Origami Fox',
    description: 'A paper fox follows light.',
    altText: 'Paper fox',
    mediaType: 'Video',
    posterUrl: 'poster.webp',
    previewUrl: 'preview.mp4',
    layout: 'Landscape',
    icon: 'seedance.png',
    defaultIcon: 'seedance.png',
    prompt: 'A paper fox follows light.',
    model: 'seedance-2.0',
    parameters: [{ key: 'duration', value: '5' }]
  },
  {
    id: 'audio-id',
    service: 'suno',
    capability: 'suno',
    routeName: 'suno-index',
    name: 'Suno',
    title: 'Amber Nocturne',
    description: 'A cinematic nocturne.',
    altText: 'Piano cover',
    mediaType: 'Audio',
    posterUrl: 'cover.jpg',
    previewUrl: 'preview.mp3',
    layout: 'Square',
    icon: 'suno.png',
    defaultIcon: 'suno.png',
    prompt: 'A cinematic nocturne.',
    model: 'suno-v4.5',
    parameters: [{ key: 'instrumental', value: 'true' }]
  }
];

function mountGrid(reduced = false, detailPreview = false) {
  vi.stubGlobal('matchMedia', () => ({
    matches: reduced,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }));
  const wrapper = mount(ShowcaseGrid, {
    props: { items, detailPreview },
    global: {
      stubs: { RouterLink: { props: ['to'], template: '<a class="router-link"><slot /></a>' } },
      mocks: { $t: (key: string, params?: { title?: string }) => `${key}${params?.title ? ` ${params.title}` : ''}` }
    }
  });
  const video = wrapper.get('video').element as HTMLVideoElement;
  const audio = wrapper.get('audio').element as HTMLAudioElement;
  Object.defineProperty(video, 'play', { value: vi.fn().mockResolvedValue(undefined) });
  Object.defineProperty(video, 'pause', { value: vi.fn() });
  Object.defineProperty(audio, 'play', { value: vi.fn().mockResolvedValue(undefined) });
  Object.defineProperty(audio, 'pause', { value: vi.fn() });
  return { wrapper, video, audio };
}

describe('ShowcaseGrid', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('renders posters, metadata-only previews, and create-similar links', () => {
    const { wrapper } = mountGrid();
    expect(wrapper.findAll('.showcase-card')).toHaveLength(2);
    expect(wrapper.get('video').attributes()).toMatchObject({ preload: 'metadata', loop: '' });
    expect((wrapper.get('video').element as HTMLVideoElement).muted).toBe(true);
    expect(wrapper.get('audio').attributes('preload')).toBe('metadata');
    expect(wrapper.findAll('.router-link')[0].text()).toContain('intro.home.showcase.createSimilar');
    expect(wrapper.find('.detail-trigger').exists()).toBe(false);
  });

  it('uses a native button to select a card for detail preview', async () => {
    const { wrapper } = mountGrid(false, true);
    const triggers = wrapper.findAll('button.detail-trigger');
    expect(triggers).toHaveLength(2);
    expect(triggers[0].attributes('type')).toBe('button');
    expect(triggers[0].attributes('aria-label')).toContain('Origami Fox');

    await triggers[1].trigger('click');
    expect(wrapper.emitted('select')).toEqual([[items[1]]]);
  });

  it('autoplays silent video, keeps audio explicit, and plays only one preview', async () => {
    const { wrapper, video, audio } = mountGrid();
    const cards = wrapper.findAll('.showcase-card');

    await cards[0].trigger('mouseenter');
    await Promise.resolve();
    expect(video.play).toHaveBeenCalled();
    await cards[1].trigger('mouseenter');
    expect(audio.play).not.toHaveBeenCalled();

    await wrapper.get('.preview-button').trigger('click');
    await Promise.resolve();
    expect(video.pause).toHaveBeenCalled();
    expect(audio.play).toHaveBeenCalled();
    expect(wrapper.emitted('select')).toBeUndefined();
    await cards[0].trigger('mouseleave');
    expect(video.pause).toHaveBeenCalled();
  });

  it('falls back to the poster without removing the create-similar action', async () => {
    const { wrapper } = mountGrid();
    await wrapper.get('video').trigger('error');
    expect(wrapper.find('video').exists()).toBe(false);
    expect(wrapper.findAll('.showcase-card')).toHaveLength(2);
    expect(wrapper.findAll('.router-link')).toHaveLength(2);
    await wrapper.findAll('.router-link')[0].trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('does not autoplay in reduced-motion mode but keeps an explicit control', async () => {
    const { wrapper, video } = mountGrid(true);
    await wrapper.findAll('.showcase-card')[0].trigger('mouseenter');
    expect(video.play).not.toHaveBeenCalled();
    expect(wrapper.findAll('.preview-button').length).toBeGreaterThan(0);

    await wrapper.findAll('.preview-button')[0].trigger('click');
    await Promise.resolve();
    expect(video.play).toHaveBeenCalled();
    expect(wrapper.findAll('.showcase-card')[0].classes()).toContain('preview-playing');
  });
});
