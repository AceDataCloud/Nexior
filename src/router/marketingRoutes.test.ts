import { describe, expect, it } from 'vitest';

import business from './business';
import { ROUTE_BUSINESS, ROUTE_INDEX } from './constants';
import home from './home';

const child = (route: any) => route.children[0];

describe('public marketing routes', () => {
  it('serves the capability-first product page at /home', () => {
    expect(home.path).toBe('/home');
    expect(child(home).name).toBe(ROUTE_INDEX);
    expect(String(child(home).component)).toContain('pages/home/Index.vue');
    expect(child(home).meta.auth).toBe(false);
  });

  it('serves the white-label business page at /business', () => {
    expect(business.path).toBe('/business');
    expect(child(business).name).toBe(ROUTE_BUSINESS);
    expect(String(child(business).component)).toContain('pages/business/Index.vue');
    expect(child(business).meta.auth).toBe(false);
  });

  it('does not retain the unpublished /intro route', () => {
    const routes = [home, business];
    expect(routes.map((route) => route.path)).not.toContain('/intro');
  });
});
