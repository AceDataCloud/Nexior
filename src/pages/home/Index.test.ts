// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAPABILITY_ICONS } from '@/constants/capabilities';
import { showcaseOperator } from '@/operators';
import Home from './Index.vue';
import { HOME_BANNERS, HOME_CAPABILITY_KEYS, HOME_CATEGORIES } from './data';

vi.mock('@/operators', () => ({ showcaseOperator: { list: vi.fn() } }));

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
  beforeEach(() => vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [] } as any));

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
    await vi.waitFor(() => expect(showcaseOperator.list).toHaveBeenCalledWith());
    expect(wrapper.getComponent({ name: 'ShowcaseGrid' }).props('items')[0].capability).toBe('seedance');
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

  it('hides only the showcase section when the anonymous list is empty', async () => {
    vi.mocked(showcaseOperator.list).mockResolvedValue({ data: [] } as any);
    const wrapper = mountHome({ id: 'studio', features: studioFeatures });
    await vi.waitFor(() => expect(showcaseOperator.list).toHaveBeenCalled());
    expect(wrapper.findComponent({ name: 'HomeCarousel' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'CategoryTiles' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'ShowcaseGrid' }).exists()).toBe(false);
  });

  it('removes a failed visual without exposing a broken URL', async () => {
    const wrapper = mountHome({ id: 'studio', features: { maestro: { enabled: true } } });
    const carousel = wrapper.getComponent({ name: 'HomeCarousel' });
    carousel.vm.$emit('image-error', carousel.props('slides')[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'HomeCarousel' }).props('slides')[0].imageUrl).toBe('');
  });
});
