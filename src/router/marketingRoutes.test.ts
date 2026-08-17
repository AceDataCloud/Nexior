import { createMemoryHistory, createRouter } from 'vue-router';
import { describe, expect, it } from 'vitest';
import business from './business';
import {
  ROUTE_BUSINESS,
  ROUTE_GROKVIDEO_INDEX,
  ROUTE_INDEX,
  ROUTE_INSPIRATION_ALL,
  ROUTE_INSPIRATION_IMAGES,
  ROUTE_INSPIRATION_MUSIC,
  ROUTE_INSPIRATION_VIDEOS,
  ROUTE_OPENAIIMAGE_INDEX,
  ROUTE_FISH_TTS_INDEX
} from './constants';
import grokvideo from './grokvideo';
import home, { homeCompatibilityRoute } from './home';
import inspiration from './inspiration';
import openaiimage from './openaiimage';
import fish from './fish';
import { HOME_BANNERS, HOME_CATEGORIES } from '@/pages/home/data';

const child = (route: any) => route.children[0];

describe('public Studio routes', () => {
  it('serves the workbench home in the real Main app shell', () => {
    expect(home.path).toBe('/');
    expect(String(home.component)).toContain('layouts/Main.vue');
    expect(String(home.component)).not.toContain('layouts/Index.vue');
    expect(child(home).name).toBe(ROUTE_INDEX);
    expect(child(home).meta.auth).toBe(false);
    expect(child(home).meta.appName).toBeUndefined();
  });

  it('keeps /home as a query- and hash-preserving compatibility route', () => {
    const target = homeCompatibilityRoute.redirect({ query: { lang: 'zh-CN' }, hash: '#popular' } as any);
    expect(target).toEqual({ name: ROUTE_INDEX, query: { lang: 'zh-CN' }, hash: '#popular', replace: true });
  });

  it('resolves every dashboard destination through a registered route name', () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [home as any, openaiimage as any, grokvideo as any, fish as any]
    });
    const items = [...HOME_BANNERS, ...HOME_CATEGORIES.flatMap((item) => item.candidates)];
    const registered = router.getRoutes().map((route) => route.name);

    for (const item of items) {
      if (registered.includes(item.routeName))
        expect(router.resolve({ name: item.routeName }).matched.length).toBeGreaterThan(0);
    }
    expect(router.resolve({ name: ROUTE_OPENAIIMAGE_INDEX }).path).toBe('/openai-image');
    expect(router.resolve({ name: ROUTE_GROKVIDEO_INDEX }).path).toBe('/grok-video');
    expect(router.resolve({ name: ROUTE_FISH_TTS_INDEX }).path).toBe('/fish/tts');
  });

  it('serves route-backed Inspiration categories in the Main shell without app bootstrap', () => {
    expect(inspiration.path).toBe('/inspiration');
    expect(String(inspiration.component)).toContain('layouts/Main.vue');
    expect(inspiration.children.map((route) => route.name)).toEqual([
      ROUTE_INSPIRATION_ALL,
      ROUTE_INSPIRATION_IMAGES,
      ROUTE_INSPIRATION_VIDEOS,
      ROUTE_INSPIRATION_MUSIC
    ]);
    expect(inspiration.children.map((route) => route.path)).toEqual(['', 'images', 'videos', 'music']);
    expect(inspiration.children.every((route) => route.meta.auth === false && !('appName' in route.meta))).toBe(true);
  });

  it('serves the white-label business page at /business', () => {
    expect(business.path).toBe('/business');
    expect(child(business).name).toBe(ROUTE_BUSINESS);
  });
});
