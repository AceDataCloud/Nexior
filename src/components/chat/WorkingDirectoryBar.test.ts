// @vitest-environment jsdom
// The working directory is a PRECONDITION for sending on desktop: local tools
// touch real files, so "which project?" cannot be inferred. These cover the
// gate itself and — more importantly — that web/mobile are untouched by it.
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WorkingDirectoryBar from './WorkingDirectoryBar.vue';

const surface = vi.hoisted(() => ({ desktop: true }));
vi.mock('@/utils/surface', () => ({
  isDesktop: () => surface.desktop,
  isAndroid: () => false,
  supportsClientTools: () => surface.desktop
}));

const bridge = vi.hoisted(() => ({
  value: null as null | Record<string, unknown>
}));
vi.mock('@/utils/desktop', () => ({
  localExec: () => bridge.value
}));

function makeBridge(over: Partial<Record<string, unknown>> = {}) {
  return {
    getConfig: vi.fn(async () => ({ roots: ['/a'], mcp: [], computerUse: false, workingDir: '' })),
    saveConfig: vi.fn(async () => true),
    pickFolder: vi.fn(async () => '/Users/me/proj'),
    ...over
  };
}

function mountBar(workingDirectory = '') {
  const commit = vi.fn();
  const wrapper = mount(WorkingDirectoryBar, {
    global: {
      mocks: {
        $t: (k: string) => k,
        $store: { state: { chat: { workingDirectory } }, commit }
      },
      stubs: { ElButton: { template: '<button><slot /></button>' }, ElTooltip: { template: '<span><slot /></span>' } }
    }
  });
  return { wrapper, commit };
}

describe('WorkingDirectoryBar', () => {
  afterEach(() => {
    surface.desktop = true;
    bridge.value = null;
    vi.clearAllMocks();
  });

  it('renders nothing on web, where there is no local filesystem', () => {
    surface.desktop = false;
    bridge.value = makeBridge();
    const { wrapper } = mountBar();
    expect(wrapper.find('.working-dir').exists()).toBe(false);
  });

  it('renders nothing without a live bridge, even on a desktop build', () => {
    bridge.value = null;
    const { wrapper } = mountBar();
    expect(wrapper.find('.working-dir').exists()).toBe(false);
  });

  it('prompts to choose a folder when none is set', () => {
    bridge.value = makeBridge();
    const { wrapper } = mountBar('');
    expect(wrapper.text()).toContain('chat.workingDir.choose');
    expect(wrapper.find('.working-dir-link').exists()).toBe(false);
  });

  it('shows the chosen directory as a quiet footer link', () => {
    bridge.value = makeBridge();
    const { wrapper } = mountBar('/Users/me/proj');
    expect(wrapper.find('.working-dir-link').exists()).toBe(true);
  });

  // Placement: the chosen state is absolutely positioned so a long path can
  // never push the centered disclaimer off-center; the call-to-action state
  // stays in flow so the button doesn't overlap it.
  it('only takes the row out of flow once a directory is chosen', () => {
    bridge.value = makeBridge();
    expect(mountBar('').wrapper.find('.working-dir').classes()).toContain('working-dir--unset');
    expect(mountBar('/Users/me/proj').wrapper.find('.working-dir').classes()).not.toContain('working-dir--unset');
  });

  it('shortens a deep path so it cannot dominate the composer row', () => {
    bridge.value = makeBridge();
    const { wrapper } = mountBar('/Users/me/very/deep/nested/proj');
    const text = wrapper.find('.working-dir-path').text();
    expect(text).toBe('…/nested/proj');
  });

  it('shows a shallow path in full', () => {
    bridge.value = makeBridge();
    const { wrapper } = mountBar('/Users/me');
    expect(wrapper.find('.working-dir-path').text()).toBe('/Users/me');
  });

  it('persists to the main process BEFORE mirroring into the store', async () => {
    // Order matters: the main process is what actually authorizes the folder.
    // Mirroring first would unblock the composer for a directory that was
    // never authorized.
    const order: string[] = [];
    const b = makeBridge({
      saveConfig: vi.fn(async () => {
        order.push('save');
        return true;
      })
    });
    bridge.value = b;
    const { wrapper, commit } = mountBar('');
    commit.mockImplementation(() => order.push('commit'));
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    expect(order).toEqual(['save', 'commit']);
    expect(commit).toHaveBeenCalledWith('chat/setWorkingDirectory', '/Users/me/proj');
  });

  it('preserves roots, mcp and computerUse when saving the directory', async () => {
    // The renderer's save payload is a full read-modify-write; dropping a field
    // here would wipe the user's authorized folders or MCP servers.
    const b = makeBridge({
      getConfig: vi.fn(async () => ({
        roots: ['/keep'],
        mcp: [{ id: 'srv', command: 'x', args: [] }],
        computerUse: true,
        workingDir: ''
      }))
    });
    bridge.value = b;
    const { wrapper } = mountBar('');
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    expect(b.saveConfig).toHaveBeenCalledWith({
      roots: ['/keep'],
      mcp: [{ id: 'srv', command: 'x', args: [] }],
      computerUse: true,
      workingDir: '/Users/me/proj'
    });
  });

  it('does nothing when the folder dialog is cancelled', async () => {
    const b = makeBridge({ pickFolder: vi.fn(async () => null) });
    bridge.value = b;
    const { wrapper, commit } = mountBar('');
    await wrapper.find('button').trigger('click');
    await new Promise((r) => setTimeout(r, 0));
    expect(b.saveConfig).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
  });

  it('re-syncs from the main process on mount (Settings may have changed it)', async () => {
    bridge.value = makeBridge({
      getConfig: vi.fn(async () => ({ roots: [], mcp: [], computerUse: false, workingDir: '/from/settings' }))
    });
    const { commit } = mountBar('');
    await new Promise((r) => setTimeout(r, 0));
    expect(commit).toHaveBeenCalledWith('chat/setWorkingDirectory', '/from/settings');
  });

  it('survives a bridge that throws on mount', async () => {
    bridge.value = makeBridge({
      getConfig: vi.fn(async () => {
        throw new Error('bridge gone');
      })
    });
    const { commit } = mountBar('/existing');
    await new Promise((r) => setTimeout(r, 0));
    expect(commit).not.toHaveBeenCalled();
  });
});
