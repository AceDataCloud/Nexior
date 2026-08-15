import { describe, expect, it } from 'vitest';

import business from './business';
import { ROUTE_BUSINESS, ROUTE_INDEX } from './constants';
import home, { homeCompatibilityRoute } from './home';
import { shouldRedirectDesktopHome } from './index';

const child = (route: any) => route.children[0];

describe('public marketing routes', () => {
  it('serves the creative product home at the canonical root path', () => {
    expect(home.path).toBe('/');
    expect(child(home).name).toBe(ROUTE_INDEX);
    expect(String(child(home).component)).toContain('pages/home/Index.vue');
    expect(child(home).meta.auth).toBe(false);
  });

  it('keeps /home as a query- and hash-preserving compatibility route', () => {
    const target = homeCompatibilityRoute.redirect({ query: { lang: 'zh-CN' }, hash: '#featured' } as any);

    expect(homeCompatibilityRoute.path).toBe('/home');
    expect(target).toEqual({ name: ROUTE_INDEX, query: { lang: 'zh-CN' }, hash: '#featured', replace: true });
  });

  it('keeps desktop in its app shell while web renders the creative home', () => {
    expect(shouldRedirectDesktopHome(true, ROUTE_INDEX)).toBe(true);
    expect(shouldRedirectDesktopHome(false, ROUTE_INDEX)).toBe(false);
    expect(shouldRedirectDesktopHome(true, ROUTE_BUSINESS)).toBe(false);
  });

  it('serves the white-label business page at /business', () => {
    expect(business.path).toBe('/business');
    expect(child(business).name).toBe(ROUTE_BUSINESS);
    expect(String(child(business).component)).toContain('pages/business/Index.vue');
    expect(child(business).meta.auth).toBe(false);
  });

  it('does not retain the unpublished /intro route', () => {
    const routes = [home, homeCompatibilityRoute, business];
    expect(routes.map((route) => route.path)).not.toContain('/intro');
  });
});
