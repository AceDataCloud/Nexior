// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAPABILITY_ICONS } from '@/constants/capabilities';
import { showcaseOperator, siteBannerOperator } from '@/operators';
import Home from './Index.vue';
import { HOME_BANNERS, HOME_CAPABILITY_KEYS, HOME_CATEGORIES } from './data';

vi.mock('@/operators', () => ({
  showcaseOperator: { list: vi.fn() },
  siteBannerOperator: { getPublic: vi.fn() }
}));
vi.mock('@/components/showcase/ShowcaseDetailDialog.vue', () => ({
  default: {
    name: 'ShowcaseDetailDialog',
    props: { item: Object },
    emits: ['close'],
    template: '<button class="detail-dialog-stub" @click="$emit(\'close\')" />'
  }
}));

const studioFeatures = Object.fromEntries(HOME_CAPABILITY_KEYS.map((key) => [key, { enabled: true }]));
const showcase = {
  id: '196387e7-f217-453f-a678-ed1165e0cbd9',
  service: 'seedance',
  task_id: 'task-1',
  data: {
    type: 'videos',
    request: { prompt: 'Paper fox' },
    response: {
      success: true,
      data: {
        video_url: 'https://cdn.acedata.cloud/video',
        last_frame_url: 'https://cdn.acedata.cloud/poster'
      }
    }
  }
};

const mountHome = (site: Record<string, unknown>) =>
  shallowMount(Home, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $i18n: { locale: 'en' },
        $router: { push: vi.fn() },
        $route: { name: 'index' },
        $store: { state: { site } }
      }
    }
  });

describe('Studio workbench home', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [] } as any);
    vi.mocked(siteBannerOperator.getPublic).mockResolvedValue({ data: [] } as any);
  });

  it('does not expose capabilities before site configuration loads', () => {
    const wrapper = mountHome({});
    expect(wrapper.find('.studio-home').exists()).toBe(false);
    expect(wrapper.find('.home-loading').exists()).toBe(true);
    expect(showcaseOperator.list).not.toHaveBeenCalled();
  });

  it('does not repeat the inspiration navigation above the home content', () => {
    const wrapper = mountHome({ id: 'studio', features: studioFeatures });
    expect(wrapper.findComponent({ name: 'PublicSectionNav' }).exists()).toBe(false);
  });

  it('covers all Studio capabilities through named-route destinations', () => {
    const destinations = [...HOME_BANNERS, ...HOME_CATEGORIES.flatMap((item) => item.candidates)];
    expect(HOME_BANNERS).toHaveLength(3);
    expect(HOME_CATEGORIES).toHaveLength(4);
    expect(new Set(HOME_CAPABILITY_KEYS).size).toBeGreaterThanOrEqual(15);
    expect(destinations.every((item) => item.routeName)).toBe(true);
    expect(destinations.some((item) => 'path' in item)).toBe(false);
  });

  it('passes every enabled child into the four category groups', () => {
    const wrapper = mountHome({ id: 'studio', features: studioFeatures });
    expect(wrapper.getComponent({ name: 'HomeCarousel' }).props('slides')).toHaveLength(3);
    const categories = wrapper.getComponent({ name: 'CategoryTiles' }).props('items');
    expect(categories).toHaveLength(4);
    expect(categories.find((item: any) => item.id === 'chat').items.map((item: any) => item.capability)).toEqual([
      'chatgpt',
      'claude',
      'gemini',
      'grok',
      'deepseek'
    ]);
    expect(wrapper.findComponent({ name: 'PopularCapabilityGrid' }).exists()).toBe(false);
  });

  it('filters showcase items to the site feature set', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [showcase] } as any);
    const wrapper = mountHome({
      id: 'video-only',
      features: { seedance: { enabled: true }, veo: { enabled: true }, kling: { enabled: false } }
    });
    await vi.waitFor(() => expect(showcaseOperator.list).toHaveBeenCalledWith(undefined, 'en'));
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')[0].capability).toBe('seedance');
  });

  it('renders Showcases in twelve-item batches with an accessible fallback button', async () => {
    const feed = Array.from({ length: 30 }, (_, index) => ({ ...showcase, id: `showcase-${index}` }));
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: feed } as any);
    const wrapper = mountHome({ id: 'studio', features: { seedance: { enabled: true } } });
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'ShowcaseGrid' }).exists()).toBe(true));
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(12);
    const button = wrapper.get('button.showcase-load-more');
    expect(button.attributes('type')).toBe('button');

    await button.trigger('click');
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(24);
    await wrapper.get('button.showcase-load-more').trigger('click');
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(30);
    expect(wrapper.find('button.showcase-load-more').exists()).toBe(false);
  });

  it('keeps manual loading available without IntersectionObserver', async () => {
    expect('IntersectionObserver' in window).toBe(false);
    const feed = Array.from({ length: 18 }, (_, index) => ({ ...showcase, id: `showcase-${index}` }));
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: feed } as any);
    const wrapper = mountHome({ id: 'studio', features: { seedance: { enabled: true } } });
    await vi.waitFor(() => expect(wrapper.find('button.showcase-load-more').exists()).toBe(true));

    await wrapper.get('button.showcase-load-more').trigger('click');
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(18);
  });

  it('returns to the first batch when the Showcase feed reloads', async () => {
    const feed = Array.from({ length: 30 }, (_, index) => ({ ...showcase, id: `showcase-${index}` }));
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: feed } as any);
    const wrapper = mountHome({ id: 'studio', features: { seedance: { enabled: true } } });
    await vi.waitFor(() => expect(wrapper.find('button.showcase-load-more').exists()).toBe(true));
    await wrapper.get('button.showcase-load-more').trigger('click');
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(24);

    await (wrapper.vm as any).loadShowcases();
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(12);
  });

  it('automatically appends one batch per sentinel viewport entry', async () => {
    let callback: IntersectionObserverCallback = () => undefined;
    class MockIntersectionObserver {
      constructor(handler: IntersectionObserverCallback) {
        callback = handler;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
    const feed = Array.from({ length: 30 }, (_, index) => ({ ...showcase, id: `showcase-${index}` }));
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: feed } as any);
    const wrapper = mountHome({ id: 'studio', features: { seedance: { enabled: true } } });
    await vi.waitFor(() => expect(wrapper.find('button.showcase-load-more').exists()).toBe(true));
    const target = wrapper.get('button.showcase-load-more').element;

    await wrapper.get('button.showcase-load-more').trigger('click');
    callback([{ isIntersecting: true, target } as IntersectionObserverEntry], {} as any);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(24);
    callback([{ isIntersecting: true, target } as IntersectionObserverEntry], {} as any);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(24);
    callback([{ isIntersecting: false, target } as IntersectionObserverEntry], {} as any);
    callback([{ isIntersecting: true, target } as IntersectionObserverEntry], {} as any);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')).toHaveLength(30);
  });

  it('applies white-label names and icons to child and showcase cards', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [showcase] } as any);
    const wrapper = mountHome({
      id: 'brand',
      features: { seedance: { enabled: true } },
      capability_overrides: {
        seedance: { display_name: 'Brand Motion', icon_url: 'https://cdn.example.com/motion.png' }
      }
    });
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'ShowcaseGrid' }).exists()).toBe(true));
    const gallery = wrapper.getComponent({ name: 'ShowcaseGrid' });
    expect(gallery.props('items')[0]).toMatchObject({
      name: 'Brand Motion',
      icon: 'https://cdn.example.com/motion.png',
      defaultIcon: CAPABILITY_ICONS.seedance
    });
    gallery.vm.$emit('icon-error', gallery.props('items')[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')[0].icon).toBe(CAPABILITY_ICONS.seedance);
  });

  it('opens and closes Showcase details from the Home gallery', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [showcase] } as any);
    const wrapper = mountHome({ id: 'studio', features: { seedance: { enabled: true } } });
    await vi.waitFor(() => expect(wrapper.findComponent({ name: 'ShowcaseGrid' }).exists()).toBe(true));
    const gallery = wrapper.getComponent({ name: 'ShowcaseGrid' });
    expect(gallery.props('detailPreview')).toBe(true);

    gallery.vm.$emit('select', gallery.props('items')[0]);
    await wrapper.vm.$nextTick();
    const dialog = wrapper.getComponent({ name: 'ShowcaseDetailDialog' });
    expect(dialog.props('item')).toMatchObject({ id: showcase.id, prompt: 'Paper fox' });

    dialog.vm.$emit('close');
    await wrapper.vm.$nextTick();
    expect(dialog.props('item')).toBeUndefined();
  });

  it('hides only the showcase section when the anonymous list is empty', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [] } as any);
    const wrapper = mountHome({ id: 'studio', features: studioFeatures });
    await vi.waitFor(() => expect(showcaseOperator.list).toHaveBeenCalled());
    expect(wrapper.findComponent({ name: 'HomeCarousel' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'CategoryTiles' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ShowcaseGrid' }).exists()).toBe(false);
  });

  it('hides individual system banners without disabling their services', () => {
    const wrapper = mountHome({
      id: 'studio',
      features: studioFeatures,
      metadata: { nexior: { hidden_default_banner_ids: ['maestro', 'seedance'] } }
    });
    const slides = wrapper.getComponent({ name: 'HomeCarousel' }).props('slides');
    expect(slides.map((item: any) => item.id)).toEqual(['gpt-image']);
  });

  it('appends tenant banners in public-feed order and resolves localized copy', async () => {
    vi.mocked(siteBannerOperator.getPublic).mockResolvedValue({
      data: [
        {
          id: 'custom-1',
          image_url: 'https://cdn.example.com/custom.webp',
          link_url: '/seedance',
          title: { en: 'Custom launch', 'zh-CN': '自定义发布' },
          subtitle: { en: 'Create now' },
          sort_order: 1
        }
      ]
    } as any);
    const wrapper = mountHome({ id: 'tenant', origin: 'tenant.studio.acedata.cloud', features: studioFeatures });
    await vi.waitFor(() => expect(siteBannerOperator.getPublic).toHaveBeenCalledWith('tenant.studio.acedata.cloud'));
    const slides = wrapper.getComponent({ name: 'HomeCarousel' }).props('slides');
    expect(slides.at(-1)).toMatchObject({
      id: 'custom-1',
      title: 'Custom launch',
      description: 'Create now',
      target: { href: '/seedance' }
    });
  });

  it('keeps default banners when the optional tenant feed fails', async () => {
    vi.mocked(siteBannerOperator.getPublic).mockRejectedValue(new Error('offline'));
    const wrapper = mountHome({ id: 'studio', features: studioFeatures });
    await vi.waitFor(() => expect(siteBannerOperator.getPublic).toHaveBeenCalled());
    expect(wrapper.getComponent({ name: 'HomeCarousel' }).props('slides')).toHaveLength(3);
  });

  it('hides the carousel when every system banner is hidden and no custom banner is active', async () => {
    const wrapper = mountHome({
      id: 'tenant',
      features: studioFeatures,
      metadata: { nexior: { hidden_default_banner_ids: ['maestro', 'gpt-image', 'seedance'] } }
    });
    await vi.waitFor(() => expect(siteBannerOperator.getPublic).toHaveBeenCalled());
    expect(wrapper.findComponent({ name: 'HomeCarousel' }).exists()).toBe(false);
  });
  it('removes a failed visual without exposing a broken URL', async () => {
    const wrapper = mountHome({ id: 'studio', features: { maestro: { enabled: true } } });
    const carousel = wrapper.getComponent({ name: 'HomeCarousel' });
    carousel.vm.$emit('image-error', carousel.props('slides')[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'HomeCarousel' }).props('slides')[0].imageUrl).toBe('');
  });
});
