// @vitest-environment jsdom
import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { historyDateCutoff, taskHistoryMixin } from './taskHistoryMixin';

function harness() {
  const tasks = { items: [{ id: 'latest', created_at: 300 }], total: 1 };
  const el = { scrollTop: 0, scrollHeight: 600, clientHeight: 400 };
  const fetch = vi.fn(async ({ createdAtMax, replace }) => {
    const items = [{ id: 'earlier', created_at: (createdAtMax || 500) - 100 }];
    tasks.items = replace ? items : [...items, ...tasks.items];
    return items;
  });
  const component = defineComponent({
    mixins: [taskHistoryMixin('fixture')],
    data: () => ({ tasks, loadingMore: false, fetchingTasks: false }),
    methods: {
      onGetTasks: fetch,
      getTasksScrollElement: () => el,
      onScrollDown: vi.fn()
    },
    template: '<div />'
  });
  const wrapper = mount(component, { global: { mocks: { $store: { state: { fixture: { tasks } } } } } });
  return { wrapper, vm: wrapper.vm as any, fetch, tasks, el };
}

describe('task history navigation', () => {
  it('uses the next local midnight including leap days and rejects invalid input', () => {
    expect(historyDateCutoff('2024-02-29')).toBe(new Date(2024, 2, 1).getTime() / 1000);
    expect(historyDateCutoff('')).toBeUndefined();
    expect(() => historyDateCutoff('2026-02-30')).toThrow();
  });

  it('replaces history for a date, keeps ordinary refreshes in that date, and returns to latest', async () => {
    const { vm, fetch } = harness();
    await vm.onHistoryDateChange('2026-10-11');
    expect(fetch).toHaveBeenLastCalledWith({ createdAtMax: historyDateCutoff('2026-10-11'), replace: true });
    expect(vm.historyQuery({})).toEqual({ createdAtMax: historyDateCutoff('2026-10-11') });
    await vm.onHistoryDateChange('');
    expect(fetch).toHaveBeenLastCalledWith({ createdAtMax: undefined, replace: true });
    expect(vm.historyDate).toBe('');
  });

  it('retains the selected date and records after a failed jump, then allows retry', async () => {
    const { vm, fetch, tasks } = harness();
    await vm.onHistoryDateChange('2026-10-11');
    const previous = tasks.items;
    fetch.mockRejectedValueOnce(new Error('offline'));
    await vm.onHistoryDateChange('2026-09-11');
    expect(vm.historyDate).toBe('2026-10-11');
    expect(tasks.items).toBe(previous);
    expect(vm.historyError).toBe(true);
    expect(vm.historyBusy).toBe(false);
    await vm.onHistoryDateChange('2026-09-11');
    expect(vm.historyDate).toBe('2026-09-11');
  });

  it('retries one upward intent that arrived during polling without a new gesture', async () => {
    const { vm, fetch } = harness();
    vm.fetchingTasks = true;
    await vm.onReachTop();
    await vm.onReachTop();
    expect(fetch).not.toHaveBeenCalled();
    vm.fetchingTasks = false;
    await flushPromises();
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('discards queued pagination when the reader moves away from the top', async () => {
    const { vm, fetch, el } = harness();
    vm.fetchingTasks = true;
    await vm.onReachTop();
    el.scrollTop = 800;
    vm.fetchingTasks = false;
    await flushPromises();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('stops repeated gestures after an empty page but resets at a new date', async () => {
    const { vm, fetch } = harness();
    fetch.mockResolvedValueOnce([]);
    await vm.onReachTop();
    await vm.onReachTop();
    expect(fetch).toHaveBeenCalledOnce();
    expect(vm.historyHasMore).toBe(false);
    await vm.onHistoryDateChange('2026-10-11');
    expect(vm.historyHasMore).toBe(true);
  });
});
