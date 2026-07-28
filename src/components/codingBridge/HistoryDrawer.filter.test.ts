// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';

import HistoryDrawer from './HistoryDrawer.vue';
import type { ICodingBridgeHistorySummary } from '@/models';

vi.mock('@/assets/images/logos/claude.svg', () => ({ default: 'claude.svg' }));
vi.mock('@/assets/images/logos/openai.svg', () => ({ default: 'openai.svg' }));
vi.mock('@/assets/images/logos/github-copilot.svg', () => ({ default: 'copilot.svg' }));

const session = (provider: string, session_id: string, updated_at: number): ICodingBridgeHistorySummary => ({
  provider: provider as ICodingBridgeHistorySummary['provider'],
  session_id,
  title: `${provider}-${session_id}`,
  updated_at
});

const SESSIONS = [
  session('claude', 'a', 300),
  session('codex', 'b', 200),
  session('claude', 'c', 100),
  session('copilot', 'd', 50)
];

const mountDrawer = (sessions = SESSIONS, nodeId: string | undefined = 'node-1') => {
  // Reactive so the `currentNodeId` watcher fires like it does against a real store.
  const state = reactive({
    codingBridge: {
      currentNodeId: nodeId,
      status: {} as Record<string, unknown>,
      history: (nodeId ? { [nodeId]: sessions } : {}) as Record<string, ICodingBridgeHistorySummary[]>
    }
  });
  const wrapper = mount(HistoryDrawer, {
    props: { visible: true },
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: { state, dispatch: vi.fn() }
      },
      // `el-drawer` teleports and `code-icon` needs the icon registry; neither
      // matters for the filter logic under test.
      stubs: {
        ElDrawer: { template: '<div><slot /></div>' },
        ElButton: { template: '<button><slot /></button>' },
        CodeIcon: { template: '<i />' },
        RedoIcon: { template: '<i />' }
      }
    }
  });
  return { wrapper, state };
};

describe('HistoryDrawer provider filter', () => {
  it('lists every session, newest first, when no filter is picked', () => {
    const { wrapper } = mountDrawer();
    expect((wrapper.vm as any).sessions.map((s: ICodingBridgeHistorySummary) => s.session_id)).toEqual([
      'a',
      'b',
      'c',
      'd'
    ]);
  });

  it('derives one chip per present provider, ordered and counted', () => {
    const { wrapper } = mountDrawer();
    expect((wrapper.vm as any).providerOptions.map((o: any) => [o.value, o.count])).toEqual([
      ['claude', 2],
      ['codex', 1],
      ['copilot', 1]
    ]);
  });

  it('narrows to the selected provider and supports multi-select', async () => {
    const { wrapper } = mountDrawer();
    const vm = wrapper.vm as any;

    vm.toggle('claude');
    await wrapper.vm.$nextTick();
    expect(vm.sessions.map((s: ICodingBridgeHistorySummary) => s.session_id)).toEqual(['a', 'c']);

    vm.toggle('copilot');
    await wrapper.vm.$nextTick();
    expect(vm.sessions.map((s: ICodingBridgeHistorySummary) => s.session_id)).toEqual(['a', 'c', 'd']);

    vm.toggle('claude');
    await wrapper.vm.$nextTick();
    expect(vm.sessions.map((s: ICodingBridgeHistorySummary) => s.session_id)).toEqual(['d']);
  });

  it('clearFilter restores the full list', async () => {
    const { wrapper } = mountDrawer();
    const vm = wrapper.vm as any;
    vm.toggle('codex');
    await wrapper.vm.$nextTick();
    expect(vm.sessions).toHaveLength(1);

    vm.clearFilter();
    await wrapper.vm.$nextTick();
    expect(vm.sessions).toHaveLength(4);
  });

  it('hides the chip row when only one provider is present', () => {
    const { wrapper } = mountDrawer([session('claude', 'a', 1)]);
    expect((wrapper.vm as any).providerOptions).toHaveLength(1);
    expect(wrapper.find('.chip').exists()).toBe(false);
  });

  it('shows the filter-empty notice, not the device-empty one, when a filter hides everything', async () => {
    const { wrapper } = mountDrawer();
    (wrapper.vm as any).selectedProviders = ['nonexistent'];
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('codingBridge.history.filterEmpty');
    expect(wrapper.text()).not.toContain('codingBridge.history.empty');
  });

  it('drops the filter when the selected device changes', async () => {
    const { wrapper, state } = mountDrawer();
    const vm = wrapper.vm as any;
    vm.toggle('claude');
    await wrapper.vm.$nextTick();
    expect(vm.selectedProviders).toEqual(['claude']);

    state.codingBridge.currentNodeId = 'node-2';
    await wrapper.vm.$nextTick();
    expect(vm.selectedProviders).toEqual([]);
  });
});
