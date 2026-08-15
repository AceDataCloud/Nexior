// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { CAPABILITY_ICONS } from '@/constants/capabilities';
import Home from './Index.vue';
import { HOME_SHOTS } from './data';

const features = {
  chatgpt: { enabled: true },
  claude: { enabled: true },
  nanobanana: { enabled: true },
  openaiimage: { enabled: true },
  seedream: { enabled: true },
  qrart: { enabled: false },
  pika: { enabled: false },
  minimax: { enabled: false },
  kling: { enabled: true },
  veo: { enabled: true },
  seedance: { enabled: true },
  suno: { enabled: true },
  maestro: { enabled: true },
  codingBridge: { enabled: true }
};

const mountHome = (site: Record<string, unknown>, locale = 'zh-CN') =>
  shallowMount(Home, {
    global: {
      mocks: {
        $t: (key: string) => key,
        $i18n: { locale },
        $router: { push: vi.fn() },
        $store: { state: { site } }
      }
    }
  });

describe('creative home', () => {
  it('does not expose capabilities before site configuration loads', () => {
    const wrapper = mountHome({});

    expect(wrapper.find('.creative-home').exists()).toBe(false);
    expect(wrapper.find('.home-loading').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('Nano Banana');
  });

  it('filters every home section to enabled capabilities', () => {
    const wrapper = mountHome({ id: 'studio', features });
    const hero = wrapper.getComponent({ name: 'WorkbenchHero' });
    const quick = wrapper.getComponent({ name: 'QuickCreateIntents' });
    const featured = wrapper.getComponent({ name: 'CapabilityRail' });
    const inspiration = wrapper.getComponent({ name: 'InspirationGallery' });

    expect(hero.props('banners').map((item: any) => item.path)).toEqual(['/maestro', '/seedance', '/nanobanana']);
    expect(quick.props('items').map((item: any) => item.path)).toEqual([
      '/chatgpt',
      '/openaiimage',
      '/seedance',
      '/suno',
      '/maestro',
      '/coding-bridge'
    ]);
    expect(featured.props('items').map((item: any) => item.capability)).not.toContain('pika');
    expect(featured.props('items').map((item: any) => item.capability)).not.toContain('qrart');
    expect(
      inspiration.props('items').every((item: any) => features[item.capability as keyof typeof features]?.enabled)
    ).toBe(true);
  });

  it('falls back to the first enabled destination for each creative intent', () => {
    const wrapper = mountHome({
      id: 'single-video',
      features: { seedance: { enabled: false }, kling: { enabled: false }, minimax: { enabled: true } }
    });
    const items = wrapper.getComponent({ name: 'QuickCreateIntents' }).props('items');

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ id: 'video', path: '/minimax' });
  });

  it('makes newly restored capabilities discoverable when enabled', () => {
    const wrapper = mountHome({
      id: 'catalog',
      features: { qrart: { enabled: true }, pika: { enabled: true }, minimax: { enabled: true } }
    });
    const items = wrapper.getComponent({ name: 'CapabilityRail' }).props('items');

    expect(items.map((item: any) => item.capability)).toEqual(['qrart', 'pika', 'minimax']);
    expect(items.map((item: any) => item.path)).toEqual(['/qrart', '/pika', '/minimax']);
  });

  it('applies white-label names and icons with bundled fallbacks', async () => {
    const wrapper = mountHome({
      id: 'brand',
      features: { nanobanana: { enabled: true } },
      capability_overrides: {
        nanobanana: { display_name: 'Brand Image', icon_url: 'https://cdn.example.com/image.png' }
      }
    });
    const rail = wrapper.getComponent({ name: 'CapabilityRail' });

    expect(rail.props('items')[0]).toMatchObject({
      name: 'Brand Image',
      icon: 'https://cdn.example.com/image.png',
      defaultIcon: CAPABILITY_ICONS.nanobanana
    });

    rail.vm.$emit('icon-error', rail.props('items')[0]);
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent({ name: 'CapabilityRail' }).props('items')[0].icon).toBe(CAPABILITY_ICONS.nanobanana);
  });

  it('uses site branding and locale-appropriate owned imagery', () => {
    const site = {
      id: 'brand',
      origin: 'brand.example.com',
      title: 'Brand Studio',
      description: 'Make something new.',
      features
    };
    const zh = mountHome(site, 'zh-CN').getComponent({ name: 'WorkbenchHero' });
    const en = mountHome(site, 'en').getComponent({ name: 'WorkbenchHero' });

    expect(zh.props()).toMatchObject({ title: 'Brand Studio', subtitle: 'Make something new.' });
    expect(zh.props('banners')[0].image).toBe(HOME_SHOTS.maestroNarrated.zh);
    expect(en.props('banners')[0].image).toBe(HOME_SHOTS.maestroNarrated.en);
  });

  it('uses creative copy for the official Studio instead of its legacy site description', () => {
    const hero = mountHome({
      id: 'studio',
      origin: 'studio.acedata.cloud',
      title: 'Ace Data Cloud',
      description: 'Easily creating your own AI websites and earning money.',
      features
    }).getComponent({ name: 'WorkbenchHero' });

    expect(hero.props()).toMatchObject({ title: 'intro.home.title', subtitle: 'intro.home.subtitle' });
  });

  it('falls back to the creative-home copy when white-label branding is empty', () => {
    const hero = mountHome({
      id: 'brand',
      origin: 'brand.example.com',
      title: ' ',
      description: '',
      features
    }).getComponent({
      name: 'WorkbenchHero'
    });

    expect(hero.props()).toMatchObject({ title: 'intro.home.title', subtitle: 'intro.home.subtitle' });
  });
});
