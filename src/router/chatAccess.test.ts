// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import chatRoute from './chatgpt';
import consoleRoute from './console';
import { ROUTE_CHATGPT_CONVERSATION_NEW, ROUTE_INDEX } from './constants';

const originalLocation = window.location;
const page = { render: () => null };
const makeRouter = () =>
  createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: ROUTE_INDEX, component: page },
      ...[chatRoute, consoleRoute].flatMap((route) =>
        route.children
          .filter((child) => !child.redirect)
          .map((child) => ({
            path: `${route.path}/${child.path}`,
            name: child.name,
            beforeEnter: child.beforeEnter,
            component: page
          }))
      )
    ]
  });

beforeEach(() => vi.stubEnv('VITE_SURFACE', 'web'));

afterEach(() => {
  vi.unstubAllEnvs();
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
});

describe('official tool direct navigation', () => {
  it.each(['desktop', 'ios', 'android'])(
    'keeps scheduled tasks and artifacts available in the %s app',
    async (surface) => {
      vi.stubEnv('VITE_SURFACE', surface);
      Object.defineProperty(window, 'location', { configurable: true, value: new URL('https://localhost') });
      for (const path of ['/chatgpt/scheduled', '/chatgpt/artifacts']) {
        const router = makeRouter();
        await router.push(path);
        expect(router.currentRoute.value.path).toBe(path);
      }
    }
  );

  it.each([
    ['studio.acedata.cloud', true],
    ['foytea.com', false],
    ['foy-ai.studio.acedata.cloud', false]
  ] as const)('%s allows official pages: %s', async (host, allowed) => {
    Object.defineProperty(window, 'location', { configurable: true, value: new URL(`https://${host}`) });
    for (const path of ['/chatgpt/scheduled', '/chatgpt/artifacts', '/console/skills', '/console/connectors']) {
      const router = makeRouter();
      await router.push(path);
      expect(router.currentRoute.value.path).toBe(allowed ? path : '/');
      await router.push('/chatgpt/conversations');
      expect(router.currentRoute.value.name).toBe(ROUTE_CHATGPT_CONVERSATION_NEW);
    }
  });
});
