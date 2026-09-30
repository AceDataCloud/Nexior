// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const hostState = vi.hoisted(() => ({ mainOfficial: false }));
vi.mock('@/utils/is', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/is')>();
  return { ...actual, isMainOfficial: () => hostState.mainOfficial };
});

import SidePanel from './SidePanel.vue';
import { ROUTE_CONSOLE_APPLICATION_LIST } from '@/router';

const push = vi.fn();
const mountSidePanel = () =>
  shallowMount(SidePanel, {
    global: {
      mocks: {
        $route: { name: ROUTE_CONSOLE_APPLICATION_LIST, matched: [{ path: '/console' }] },
        $router: { push },
        $store: { getters: { user: { id: 'user-1' } } },
        $t: (key: string) => key
      }
    }
  });

const linkKeys = (wrapper: ReturnType<typeof mountSidePanel>): string[] =>
  (wrapper.vm as unknown as { links: { key: string }[] }).links.map((link) => link.key);

describe('ConsoleSidePanel host visibility', () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    vi.stubEnv('VITE_SURFACE', 'web');
    hostState.mainOfficial = false;
    push.mockReset();
  });

  it('shows only the regular console pages on white-label and subsite hosts', () => {
    expect(linkKeys(mountSidePanel())).toEqual(['application-list', 'order-list', 'usage-list']);
  });

  it('shows managed capabilities on the main official host', () => {
    hostState.mainOfficial = true;

    expect(linkKeys(mountSidePanel())).toEqual([
      'application-list',
      'order-list',
      'usage-list',
      'connectors',
      'skills',
      'browser-devices'
    ]);
  });

  it.each(['ios', 'android', 'desktop'])('shows managed capabilities inside the %s app', (surface) => {
    vi.stubEnv('VITE_SURFACE', surface);
    expect(linkKeys(mountSidePanel())).toEqual([
      'application-list',
      'order-list',
      'usage-list',
      'connectors',
      'skills',
      'browser-devices'
    ]);
  });

  it('keeps navigation working for a regular console page', async () => {
    const wrapper = mountSidePanel();
    await wrapper.find('.link').trigger('click');

    expect(push).toHaveBeenCalledWith({ name: ROUTE_CONSOLE_APPLICATION_LIST });
  });
});
