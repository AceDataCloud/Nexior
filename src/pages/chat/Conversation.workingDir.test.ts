// @vitest-environment jsdom
// The desktop app must not let a message be sent before the user has chosen the
// project the AI will work in — local tools touch real files, and a wrong guess
// edits the wrong repo. The most important assertions here are the NEGATIVE
// ones: web and mobile must be completely unaffected by this gate.
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi, afterEach } from 'vitest';

import { Status } from '@/models';
import Conversation from './Conversation.vue';

const surface = vi.hoisted(() => ({ desktop: false }));
vi.mock('@/utils/surface', () => ({
  isDesktop: () => surface.desktop,
  isAndroid: () => false,
  supportsClientTools: () => surface.desktop,
  getSurface: () => (surface.desktop ? 'desktop' : 'web')
}));

const bridge = vi.hoisted(() => ({ value: null as null | Record<string, unknown> }));

/** Minimal bridge: the page calls listTools()/getConfig() on mount. */
function fakeBridge() {
  return {
    listTools: vi.fn(async () => []),
    getConfig: vi.fn(async () => ({ roots: [], mcp: [], computerUse: false, workingDir: '' })),
    saveConfig: vi.fn(async () => true),
    pickFolder: vi.fn(async () => null)
  };
}
vi.mock('@/utils/desktop', () => ({
  localExec: () => bridge.value,
  desktopBridge: () => undefined
}));

function mountConversation(workingDirectory = '') {
  return shallowMount(Conversation, {
    global: {
      stubs: {
        Layout: { template: '<main><slot name="chat" /></main>' },
        ElSkeleton: { template: '<div />' },
        ElSkeletonItem: { template: '<span />' }
      },
      mocks: {
        $t: (key: string) => key,
        $route: { matched: [{ path: '/chatgpt' }], params: {}, path: '/chatgpt', query: {} },
        $router: { push: vi.fn(), replace: vi.fn() },
        $store: {
          commit: vi.fn(),
          dispatch: vi.fn(() => Promise.resolve(undefined)),
          getters: { authenticated: true },
          state: {
            chat: {
              application: { id: 'app-1' },
              applications: [],
              conversations: [],
              credential: { token: 'tk' },
              memoryEnabled: true,
              workingDirectory,
              model: undefined,
              modelGroup: undefined,
              service: undefined,
              status: { getApplications: Status.Success }
            }
          }
        }
      }
    }
  });
}

type Vm = { ready: boolean; needsWorkingDirectory: boolean; onSubmit: () => Promise<void>; messages: unknown[] };

describe('working directory gate', () => {
  afterEach(() => {
    surface.desktop = false;
    bridge.value = null;
    vi.clearAllMocks();
  });

  it('blocks sending on desktop until a directory is chosen', () => {
    surface.desktop = true;
    bridge.value = fakeBridge();
    const vm = mountConversation('').vm as unknown as Vm;
    expect(vm.needsWorkingDirectory).toBe(true);
    expect(vm.ready).toBe(false);
  });

  it('allows sending once a directory is chosen', () => {
    surface.desktop = true;
    bridge.value = fakeBridge();
    const vm = mountConversation('/Users/me/proj').vm as unknown as Vm;
    expect(vm.needsWorkingDirectory).toBe(false);
    expect(vm.ready).toBe(true);
  });

  // The gate must never reach users who have no local filesystem to point at.
  it('does not gate the web build', () => {
    surface.desktop = false;
    bridge.value = null;
    const vm = mountConversation('').vm as unknown as Vm;
    expect(vm.needsWorkingDirectory).toBe(false);
    expect(vm.ready).toBe(true);
  });

  // Android exposes a localExec bridge but stubs pickFolder() to return null,
  // so gating on the bridge alone would strand it with an unsatisfiable
  // precondition — hence the isDesktop() half of the check.
  it('does not gate a non-desktop surface that still exposes a bridge', () => {
    surface.desktop = false;
    bridge.value = fakeBridge();
    const vm = mountConversation('').vm as unknown as Vm;
    expect(vm.needsWorkingDirectory).toBe(false);
    expect(vm.ready).toBe(true);
  });

  it('drops a direct onSubmit call that bypasses the disabled composer', async () => {
    // onDraft() and the ?query= deep-link call onSubmit directly, so the
    // computed `ready` alone is not a sufficient guard.
    surface.desktop = true;
    bridge.value = fakeBridge();
    const wrapper = mountConversation('');
    const vm = wrapper.vm as unknown as Vm;
    await wrapper.setData({ question: 'hello' });
    await vm.onSubmit();
    expect(vm.messages).toEqual([]);
  });
});
