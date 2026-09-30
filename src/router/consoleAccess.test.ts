// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { openConnectionsManager } from '@/utils/connections';

import consoleRoute, { managedConsoleOnly } from './console';
import {
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_BROWSER_DEVICES,
  ROUTE_CONSOLE_CONNECTORS,
  ROUTE_CONSOLE_SKILLS,
  ROUTE_INDEX
} from './constants';

const childRoute = (name: string) => consoleRoute.children.find((route) => route.name === name);

const originalLocation = window.location;
function setHost(host: string) {
  Object.defineProperty(window, 'location', { configurable: true, value: new URL(`https://${host}`) });
}

describe('official console capability routes', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });
  beforeEach(() => {
    vi.stubEnv('VITE_SURFACE', 'web');
    setHost('tenant.studio.acedata.cloud');
  });

  it('allows the connectors, skills, and browser devices pages on the main official host', () => {
    setHost('studio.acedata.cloud');

    expect(managedConsoleOnly()).toBe(true);
    for (const name of [ROUTE_CONSOLE_CONNECTORS, ROUTE_CONSOLE_SKILLS, ROUTE_CONSOLE_BROWSER_DEVICES]) {
      expect(childRoute(name)?.beforeEnter).toBe(managedConsoleOnly);
    }
  });

  it.each(['tenant.studio.acedata.cloud', 'example.com', 'localhost', 'studio.acedata.cloud.evil.example'])(
    'redirects the web host %s to the home page',
    (host) => {
      setHost(host);
      expect(managedConsoleOnly()).toEqual({ name: ROUTE_INDEX, replace: true });
    }
  );

  it.each(['ios', 'android', 'desktop'])('keeps connector navigation inside the %s app', async (surface) => {
    vi.stubEnv('VITE_SURFACE', surface);
    setHost(surface === 'desktop' ? 'bundle' : 'localhost');
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: ROUTE_INDEX, component: {} },
        { path: '/chat', component: {} },
        ...consoleRoute.children
          .filter((route) => route.beforeEnter)
          .map((route) => ({
            name: route.name,
            beforeEnter: route.beforeEnter,
            path: `/console/${route.path}`,
            component: {}
          }))
      ]
    });
    await router.push('/chat');
    openConnectionsManager('github', router);
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe(ROUTE_CONSOLE_CONNECTORS));
    expect(router.currentRoute.value.query).toEqual({ connect: 'github' });
    for (const name of [ROUTE_CONSOLE_SKILLS, ROUTE_CONSOLE_BROWSER_DEVICES]) {
      await router.push({ name });
      expect(router.currentRoute.value.name).toBe(name);
    }
  });

  it('does not restrict the regular white-label console pages', () => {
    expect(childRoute(ROUTE_CONSOLE_APPLICATION_LIST)?.beforeEnter).toBeUndefined();
  });
});
