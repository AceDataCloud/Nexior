import { describe, expect, it, vi } from 'vitest';
import { startPostMountBoot } from './postMountBoot';

describe('startPostMountBoot', () => {
  it('starts asynchronous work without delaying the caller', () => {
    let finish!: () => void;
    const task = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const onError = vi.fn();

    startPostMountBoot(task, onError);

    expect(task).toHaveBeenCalledOnce();
    expect(onError).not.toHaveBeenCalled();
    finish();
  });

  it('reports a failed background task', async () => {
    const error = new Error('offline');
    const onError = vi.fn();

    startPostMountBoot(async () => {
      throw error;
    }, onError);
    await Promise.resolve();

    expect(onError).toHaveBeenCalledWith(error);
  });
});
