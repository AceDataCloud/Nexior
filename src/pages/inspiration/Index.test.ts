// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { showcaseOperator } from '@/operators';
import { ROUTE_INSPIRATION_IMAGES } from '@/router/constants';
import Inspiration from './Index.vue';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  route: { name: 'inspiration-images', query: {} as Record<string, string> },
  store: {
    state: {
      site: {
        id: 'studio',
        features: { nanobanana: { enabled: true }, seedance: { enabled: true } }
      }
    }
  }
}));

vi.mock('@/operators', () => ({ showcaseOperator: { list: vi.fn(), clearCache: vi.fn() } }));
vi.mock('vue-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-router')>()),
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.push })
}));
vi.mock('vuex', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vuex')>()),
  useStore: () => mocks.store
}));
vi.mock('vue-i18n', async (importOriginal) => ({
  ...(await importOriginal<typeof import('vue-i18n')>()),
  useI18n: () => ({ locale: { value: 'en' } })
}));
vi.mock('./components/InspirationDetailDialog.vue', () => ({
  default: { name: 'InspirationDetailDialog', emits: ['close'], template: '<div />' }
}));

const image = {
  id: '196387e7-f217-453f-a678-ed1165e0cbd9',
  service: 'nano-banana',
  task_id: null,
  data: {
    type: 'images',
    request: { prompt: 'Origami orchard', model: 'nano-banana-pro', aspect_ratio: '3:4' },
    response: { success: true, data: [{ image_url: 'https://cdn.acedata.cloud/image.jpg' }] }
  }
};
const video = {
  id: '425b90c1-681c-4395-ae55-777d73113489',
  service: 'seedance',
  task_id: null,
  data: {
    type: 'videos',
    request: { prompt: 'Paper bird', model: 'seedance', ratio: '9:16' },
    response: {
      success: true,
      data: {
        video_url: 'https://cdn.acedata.cloud/video.mp4',
        last_frame_url: 'https://cdn.acedata.cloud/poster.jpg'
      }
    }
  }
};

function mountPage(query: Record<string, string> = {}) {
  mocks.route.name = ROUTE_INSPIRATION_IMAGES;
  mocks.route.query = query;
  const wrapper = shallowMount(Inspiration, {
    global: {
      mocks: {
        $t: (key: string) => key
      },
      stubs: {
        RouterLink: { props: ['to'], template: '<a><slot /></a>' },
        PublicSectionNav: true,
        InspirationMasonry: true,
        InspirationDetailDialog: true
      }
    }
  });
  return { wrapper, push: mocks.push, route: mocks.route };
}

describe('Inspiration gallery page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.route.query = {};
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [image, video] } as any);
  });

  it('loads the anonymous feed once and filters the image route without per-task requests', async () => {
    const { wrapper } = mountPage();
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'InspirationMasonry' }).exists()).toBe(true));
    expect(showcaseOperator.list).toHaveBeenCalledWith();
    expect(showcaseOperator.clearCache).toHaveBeenCalledOnce();
    expect(wrapper.getComponent({ name: 'InspirationMasonry' }).props('items')).toHaveLength(1);
    expect(wrapper.getComponent({ name: 'InspirationMasonry' }).props('items')[0].service).toBe('nano-banana');
  });

  it('writes the selected UUID to the current route and removes it on close', async () => {
    const { wrapper, push, route } = mountPage({ service: 'nano-banana' });
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'InspirationMasonry' }).exists()).toBe(true));
    const selected = wrapper.getComponent({ name: 'InspirationMasonry' }).props('items')[0];
    wrapper.getComponent({ name: 'InspirationMasonry' }).vm.$emit('select', selected);
    expect(push).toHaveBeenCalledWith({
      name: ROUTE_INSPIRATION_IMAGES,
      query: { service: 'nano-banana', showcase: image.id }
    });

    route.query = { service: 'nano-banana', showcase: image.id };
    wrapper.getComponent({ name: 'InspirationDetailDialog' }).vm.$emit('close');
    expect(push).toHaveBeenLastCalledWith({
      name: ROUTE_INSPIRATION_IMAGES,
      query: { service: 'nano-banana' }
    });
  });

  it('clears an unavailable deep link after loading completes', async () => {
    const { push } = mountPage({ showcase: 'd4ee4644-1246-4d97-802b-384643eb2db2' });
    await vi.waitFor(() => expect(showcaseOperator.list).toHaveBeenCalled());
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith({ name: ROUTE_INSPIRATION_IMAGES, query: {} }));
  });
});
