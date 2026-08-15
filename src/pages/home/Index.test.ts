// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { CAPABILITY_ICONS } from '@/constants/capabilities';
import Home from './Index.vue';
import { HOME_BANNERS, HOME_CAPABILITY_KEYS, HOME_CATEGORIES, HOME_POPULAR } from './data';

const studioFeatures = Object.fromEntries(HOME_CAPABILITY_KEYS.map((key) => [key, { enabled: true }]));

const mountHome = (site: Record<string, unknown>) =>
  shallowMount(Home, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $router: { push: vi.fn() },
        $route: { name: 'index' },
        $store: { state: { site } }
      }
    }
  });

describe('Studio workbench home', () => {
  it('does not expose capabilities before site configuration loads', () => {
    const wrapper = mountHome({});

    expect(wrapper.find('.studio-home').exists()).toBe(false);
    expect(wrapper.find('.home-loading').exists()).toBe(true);
  });

  it('covers all Studio capabilities through named-route destinations', () => {
    const destinations = [...HOME_BANNERS, ...HOME_CATEGORIES.flatMap((item) => item.candidates), ...HOME_POPULAR];
    expect(HOME_BANNERS).toHaveLength(3);
    expect(HOME_CATEGORIES).toHaveLength(4);
    expect(HOME_POPULAR.length).toBeGreaterThanOrEqual(8);
    expect(new Set(HOME_CAPABILITY_KEYS).size).toBeGreaterThanOrEqual(15);
    expect(destinations.every((item) => item.routeName)).toBe(true);
    expect(destinations.some((item) => 'path' in item)).toBe(false);
  });

  it('passes all enabled Studio entries to the three dashboard sections', () => {
    const wrapper = mountHome({ id: 'studio', features: studioFeatures });

    expect(wrapper.getComponent({ name: 'HomeCarousel' }).props('slides')).toHaveLength(3);
    expect(wrapper.getComponent({ name: 'CategoryTiles' }).props('items')).toHaveLength(4);
    expect(wrapper.getComponent({ name: 'PopularCapabilityGrid' }).props('items').length).toBeGreaterThanOrEqual(8);
  });

  it('filters every section to the current site feature set', () => {
    const wrapper = mountHome({
      id: 'video-only',
      features: { seedance: { enabled: true }, veo: { enabled: true }, kling: { enabled: false } }
    });

    expect(
      wrapper
        .getComponent({ name: 'HomeCarousel' })
        .props('slides')
        .map((item: any) => item.capability)
    ).toEqual(['seedance']);
    expect(
      wrapper
        .getComponent({ name: 'CategoryTiles' })
        .props('items')
        .map((item: any) => item.capability)
    ).toEqual(['seedance']);
    expect(
      wrapper
        .getComponent({ name: 'PopularCapabilityGrid' })
        .props('items')
        .map((item: any) => item.capability)
    ).toEqual(['veo']);
  });

  it('applies white-label names and icons with bundled fallback', async () => {
    const wrapper = mountHome({
      id: 'brand',
      features: { claude: { enabled: true } },
      capability_overrides: {
        claude: { display_name: 'Brand Writer', icon_url: 'https://cdn.example.com/writer.png' }
      }
    });
    const grid = wrapper.getComponent({ name: 'PopularCapabilityGrid' });
    expect(grid.props('items')[0]).toMatchObject({
      name: 'Brand Writer',
      icon: 'https://cdn.example.com/writer.png',
      defaultIcon: CAPABILITY_ICONS.claude
    });

    grid.vm.$emit('icon-error', grid.props('items')[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'PopularCapabilityGrid' }).props('items')[0].icon).toBe(
      CAPABILITY_ICONS.claude
    );
  });

  it('removes a failed visual without exposing a broken URL', async () => {
    const wrapper = mountHome({ id: 'studio', features: { maestro: { enabled: true } } });
    const carousel = wrapper.getComponent({ name: 'HomeCarousel' });

    carousel.vm.$emit('image-error', carousel.props('slides')[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'HomeCarousel' }).props('slides')[0].imageUrl).toBe('');
  });
});
