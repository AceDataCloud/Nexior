// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UpdateMenuItem from './UpdateMenuItem.vue';
import type { UpdaterState } from '@/utils/desktop';

const updater = vi.hoisted(() => ({
  state: { phase: 'idle', currentVersion: '1.0.0' } as UpdaterState,
  listener: null as ((state: UpdaterState) => void) | null,
  check: vi.fn(),
  install: vi.fn(),
  getState: vi.fn(),
  onState: vi.fn()
}));

vi.mock('@/utils/desktop', () => ({
  desktopBridge: () => ({ updater })
}));

vi.mock('element-plus', async (importOriginal) => {
  const actual = await importOriginal<typeof import('element-plus')>();
  return {
    ...actual,
    ElMessage: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
    ElMessageBox: { confirm: vi.fn() }
  };
});

const mountItem = () =>
  shallowMount(UpdateMenuItem, {
    global: {
      mocks: {
        $t: (key: string, params?: Record<string, unknown>) => `${key}${params ? JSON.stringify(params) : ''}`
      },
      stubs: { ElDropdownItem: { template: '<button><slot /></button>' }, RefreshIcon: true }
    }
  });

describe('UpdateMenuItem', () => {
  beforeEach(() => {
    updater.state = { phase: 'idle', currentVersion: '1.0.0' };
    updater.listener = null;
    updater.check.mockReset().mockResolvedValue(updater.state);
    updater.install.mockReset().mockResolvedValue(true);
    updater.getState.mockReset().mockImplementation(async () => updater.state);
    updater.onState.mockReset().mockImplementation((cb: (state: UpdaterState) => void) => {
      updater.listener = cb;
      return vi.fn();
    });
  });

  it('checks for an update from the profile item', async () => {
    const wrapper = mountItem();
    await flushPromises();
    await wrapper.trigger('click');
    expect(updater.check).toHaveBeenCalledOnce();
  });

  it('shows unsupported feedback after a manual development check', async () => {
    const { ElMessage } = await import('element-plus');
    updater.state = { phase: 'unsupported', currentVersion: '1.0.0' };
    updater.check.mockResolvedValue(updater.state);
    const wrapper = mountItem();
    await flushPromises();
    await wrapper.trigger('click');
    await flushPromises();
    expect(ElMessage.info).toHaveBeenCalledOnce();
  });

  it('renders download progress from main-process events', async () => {
    const wrapper = mountItem();
    await flushPromises();
    updater.listener?.({ phase: 'downloading', currentVersion: '1.0.0', availableVersion: '1.1.0', percent: 42 });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('common.update.downloading');
    expect(wrapper.text()).toContain('42');
  });

  it('only requests installation after the update is downloaded', async () => {
    const { ElMessageBox } = await import('element-plus');
    vi.mocked(ElMessageBox.confirm).mockResolvedValue({ action: 'confirm' } as never);
    mountItem();
    await flushPromises();
    updater.listener?.({ phase: 'downloaded', currentVersion: '1.0.0', availableVersion: '1.1.0' });
    await flushPromises();
    expect(ElMessageBox.confirm).toHaveBeenCalledOnce();
    expect(updater.install).toHaveBeenCalledOnce();
  });
});
