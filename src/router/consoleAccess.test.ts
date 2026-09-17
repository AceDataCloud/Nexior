import { beforeEach, describe, expect, it, vi } from 'vitest';

const hostState = vi.hoisted(() => ({ mainOfficial: false }));
vi.mock('@/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils')>();
  return { ...actual, isMainOfficial: () => hostState.mainOfficial };
});

import consoleRoute, { mainOfficialConsoleOnly } from './console';
import {
  ROUTE_CONSOLE_APPLICATION_LIST,
  ROUTE_CONSOLE_BROWSER_DEVICES,
  ROUTE_CONSOLE_CONNECTORS,
  ROUTE_CONSOLE_SKILLS,
  ROUTE_INDEX
} from './constants';

const childRoute = (name: string) => consoleRoute.children.find((route) => route.name === name);

describe('official console capability routes', () => {
  beforeEach(() => {
    hostState.mainOfficial = false;
  });

  it('allows the connectors, skills, and browser devices pages on the main official host', () => {
    hostState.mainOfficial = true;

    expect(mainOfficialConsoleOnly()).toBe(true);
    for (const name of [ROUTE_CONSOLE_CONNECTORS, ROUTE_CONSOLE_SKILLS, ROUTE_CONSOLE_BROWSER_DEVICES]) {
      expect(childRoute(name)?.beforeEnter).toBe(mainOfficialConsoleOnly);
    }
  });

  it('redirects white-label and subsite hosts to the home page', () => {
    expect(mainOfficialConsoleOnly()).toEqual({ name: ROUTE_INDEX, replace: true });
  });

  it('does not restrict the regular white-label console pages', () => {
    expect(childRoute(ROUTE_CONSOLE_APPLICATION_LIST)?.beforeEnter).toBeUndefined();
  });
});
