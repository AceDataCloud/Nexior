import { describe, expect, it, vi } from 'vitest';
import { loadPreviousPage, type TasksLike } from './pagination';

const item = (created_at: number) => ({ id: String(created_at), created_at });

describe('history pagination', () => {
  it('continues across three pages even when count describes only the last response', async () => {
    let tasks: TasksLike = { items: [item(40)], total: 1 };
    const fetch = vi.fn(async (cursor: number) => {
      tasks = { items: [item(cursor - 10), ...tasks.items!], total: 1 };
      return [item(cursor - 10)];
    });
    const options = { getTasks: () => tasks, loading: false, setLoading: vi.fn(), fetch };
    expect(await loadPreviousPage(options)).toBe('loaded');
    expect(await loadPreviousPage(options)).toBe('loaded');
    expect(await loadPreviousPage(options)).toBe('loaded');
    expect(fetch.mock.calls.map(([cursor]) => cursor)).toEqual([40, 30, 20]);
  });

  it('preserves movement during a pending fetch when older records are prepended', async () => {
    let tasks: TasksLike = { items: [item(40)] };
    const el = { scrollHeight: 1000, scrollTop: 100 } as HTMLElement;
    const fetch = async () => {
      el.scrollTop = 20;
      Object.assign(el, { scrollHeight: 1400 });
      tasks = { items: [item(30), item(40)] };
      return [item(30)];
    };
    await loadPreviousPage({
      getTasks: () => tasks,
      loading: false,
      setLoading: vi.fn(),
      fetch,
      getScrollElement: () => el
    });
    expect(el.scrollTop).toBe(420);
  });

  it('stops on a non-advancing page and does not recurse or issue duplicate requests', async () => {
    const fetch = vi.fn().mockResolvedValue([]);
    expect(
      await loadPreviousPage({ getTasks: () => ({ items: [item(40)] }), loading: false, setLoading: vi.fn(), fetch })
    ).toBe('exhausted');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('releases the loading guard on errors and permits retry', async () => {
    const setLoading = vi.fn();
    const options = {
      getTasks: () => ({ items: [item(40)] }),
      loading: false,
      setLoading,
      fetch: vi.fn().mockRejectedValue(new Error('offline'))
    };
    await expect(loadPreviousPage(options)).rejects.toThrow('offline');
    expect(setLoading.mock.calls).toEqual([[true], [false]]);
    options.fetch.mockResolvedValue([]);
    expect(await loadPreviousPage(options)).toBe('exhausted');
  });
});
