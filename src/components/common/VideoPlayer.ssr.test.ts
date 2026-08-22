// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { renderToString } from '@vue/server-renderer';
import { createSSRApp, type Component } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import CommonVideoPlayer from './VideoPlayer.vue';
import PikaVideoPlayer from '@/components/pika/VideoPlayer.vue';

vi.mock('@skjnldsv/vue-plyr', () => ({ default: { name: 'VuePlyr', template: '<div><slot /></div>' } }));

const pikaVideo = { video_url: 'https://cdn.example.com/video.mp4', image_url: 'https://cdn.example.com/poster.webp' };

const render = (component: Component, props: Record<string, unknown>) => {
  const app = createSSRApp(component, props);
  app.config.globalProperties.$t = (key: string) => key;
  return renderToString(app);
};

const mountOptions = {
  global: {
    mocks: { $t: (key: string) => key },
    stubs: { VuePlyr: true }
  }
};

describe('VideoPlayer SSR boundary', () => {
  it('renders both players on the server without loading the browser-only player', async () => {
    await expect(render(CommonVideoPlayer, { src: pikaVideo.video_url })).resolves.toContain('common.button.download');
    await expect(render(PikaVideoPlayer, { modelValue: pikaVideo })).resolves.not.toContain('<video');
  });

  it('enables the async player after mounting in a browser', () => {
    const common = shallowMount(CommonVideoPlayer, { props: { src: pikaVideo.video_url }, ...mountOptions });
    const pika = shallowMount(PikaVideoPlayer, { props: { modelValue: pikaVideo }, ...mountOptions });
    expect((common.vm as unknown as { clientReady: boolean }).clientReady).toBe(true);
    expect((pika.vm as unknown as { clientReady: boolean }).clientReady).toBe(true);
  });
});
