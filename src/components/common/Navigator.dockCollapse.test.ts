// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ROUTE_INDEX } from '@/router';
import Navigator from './Navigator.vue';

type DockCtx = {
  direction: string;
  $store: { state: { setting?: { dockCollapsed?: boolean } }; commit: ReturnType<typeof vi.fn> };
};

const computed = Navigator.computed as unknown as { dockCollapsed: (this: DockCtx) => boolean };
const methods = Navigator.methods as unknown as {
  syncDockClass: (collapsed: boolean) => void;
  onToggleDock: (this: DockCtx) => void;
};

function ctx(direction: string, dockCollapsed?: boolean): DockCtx {
  return { direction, $store: { state: { setting: { dockCollapsed } }, commit: vi.fn() } };
}

describe('Navigator mobile dock collapse', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dock-collapsed');
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        disconnect() {}
      }
    );
  });

  it('only collapses in row (mobile) mode', () => {
    expect(computed.dockCollapsed.call(ctx('row', true))).toBe(true);
    // The desktop rail must never collapse, even if the persisted flag is on.
    expect(computed.dockCollapsed.call(ctx('column', true))).toBe(false);
  });

  it('defaults to expanded when nothing is persisted', () => {
    expect(computed.dockCollapsed.call({ direction: 'row', $store: { state: {}, commit: vi.fn() } })).toBe(false);
  });

  it('toggles the persisted setting rather than local state', () => {
    const c = ctx('row', false);
    methods.onToggleDock.call(c);
    expect(c.$store.commit).toHaveBeenCalledWith('setSetting', { dockCollapsed: true });

    const collapsed = ctx('row', true);
    methods.onToggleDock.call(collapsed);
    expect(collapsed.$store.commit).toHaveBeenCalledWith('setSetting', { dockCollapsed: false });
  });

  it('publishes the state on <html> so the layouts can reclaim the height', () => {
    methods.syncDockClass(true);
    expect(document.documentElement.classList.contains('dock-collapsed')).toBe(true);
    methods.syncDockClass(false);
    expect(document.documentElement.classList.contains('dock-collapsed')).toBe(false);
  });

  it('keeps a fixed Home action in the mobile dock', async () => {
    const push = vi.fn();
    const wrapper = shallowMount(Navigator, {
      props: { direction: 'row' },
      global: {
        stubs: {
          ElTooltip: { template: '<div><slot /></div>' },
          ElImage: true,
          ElPopover: true,
          UserCenter: true,
          Logo: true
        },
        mocks: {
          $t: (key: string) => key,
          $route: { name: 'chatgpt-conversation-new' },
          $router: { push },
          $store: {
            state: { token: {}, site: { features: {} }, setting: { dockCollapsed: false } },
            commit: vi.fn()
          }
        }
      }
    });

    const button = wrapper.get('.home-button');
    expect(button.attributes('aria-label')).toBe('common.nav.home');
    await button.trigger('click');
    expect(push).toHaveBeenCalledWith({ name: ROUTE_INDEX });
  });
});
