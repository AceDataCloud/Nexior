// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import HomeCarousel from './HomeCarousel.vue';
import type { ResolvedHomeBanner } from '../data';

const slides: ResolvedHomeBanner[] = [0, 1, 2].map((index) => ({
  id: `slide-${index}`,
  capability: 'maestro',
  routeName: `route-${index}`,
  name: `Product ${index}`,
  title: `Slide ${index}`,
  eyebrow: 'Featured',
  description: `Description ${index}`,
  icon: 'icon.png',
  defaultIcon: 'icon.png',
  imageUrl: `image-${index}.webp`,
  target: { routeName: `route-${index}` }
}));

function mountCarousel(items = slides) {
  return mount(HomeCarousel, {
    props: { slides: items },
    global: {
      stubs: {
        RouterLink: { props: ['to'], template: `<a :href="typeof to === 'string' ? to : to.name"><slot /></a>` }
      },
      mocks: { $t: (key: string, params?: Record<string, unknown>) => `${key}${params ? JSON.stringify(params) : ''}` }
    }
  });
}

describe('HomeCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('starts on the first slide and advances with controls', async () => {
    const wrapper = mountCarousel();
    expect(wrapper.findAll('.slide')[0].classes()).toContain('active');

    await wrapper.get('.arrow.next').trigger('click');
    expect(wrapper.findAll('.slide')[1].classes()).toContain('active');
    await wrapper.get('.arrow.previous').trigger('click');
    expect(wrapper.findAll('.slide')[0].classes()).toContain('active');
  });

  it('wraps and exposes the active dot', async () => {
    const wrapper = mountCarousel();
    await wrapper.get('.arrow.previous').trigger('click');
    expect(wrapper.findAll('.slide')[2].classes()).toContain('active');
    expect(wrapper.findAll('.dots button')[2].attributes('aria-current')).toBe('true');
  });

  it('autoplays unless hover or focus pauses it', async () => {
    const wrapper = mountCarousel();
    vi.advanceTimersByTime(5600);
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.slide')[1].classes()).toContain('active');

    await wrapper.trigger('mouseenter');
    vi.advanceTimersByTime(11200);
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.slide')[1].classes()).toContain('active');

    await wrapper.trigger('mouseleave');
    vi.advanceTimersByTime(5600);
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.slide')[2].classes()).toContain('active');
  });

  it('disables autoplay for reduced motion and hides controls for one slide', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }));
    const wrapper = mountCarousel(slides.slice(0, 1));
    vi.advanceTimersByTime(20000);
    expect(wrapper.find('.arrow').exists()).toBe(false);
    expect(wrapper.findAll('.slide')[0].classes()).toContain('active');
  });

  it('marks only the first image eager and high priority', () => {
    const wrapper = mountCarousel();
    const images = wrapper.findAll('.slide > img');
    expect(images[0].attributes()).toMatchObject({ loading: 'eager', fetchpriority: 'high' });
    expect(images[1].attributes()).toMatchObject({ loading: 'lazy', fetchpriority: 'auto' });
  });
  it('renders named routes, internal paths, external links, and static slides safely', () => {
    const targets: ResolvedHomeBanner[] = [
      { ...slides[0], id: 'named', target: { routeName: 'seedance' } },
      { ...slides[1], id: 'internal', target: { href: '/seedance' } },
      { ...slides[2], id: 'external', target: { href: 'https://example.com/activity' } },
      { ...slides[0], id: 'static', target: null }
    ];
    const wrapper = mountCarousel(targets);
    const rendered = wrapper.findAll('.slide');
    expect(rendered[0].attributes('href')).toBe('seedance');
    expect(rendered[1].attributes('href')).toBe('/seedance');
    expect(rendered[2].element.tagName).toBe('A');
    expect(rendered[2].attributes()).toMatchObject({
      href: 'https://example.com/activity',
      target: '_blank',
      rel: 'noopener noreferrer'
    });
    expect(rendered[3].element.tagName).toBe('DIV');
    expect(rendered[3].classes()).toContain('static');
    expect(rendered[3].find('.action').exists()).toBe(false);
  });
});
