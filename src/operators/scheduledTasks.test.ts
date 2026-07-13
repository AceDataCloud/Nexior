import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { scheduledTasksOperator } from './scheduledTasks';

vi.mock('axios', () => ({
  default: { post: vi.fn() }
}));

const post = vi.mocked(axios.post);

describe('scheduledTasksOperator outcome actions', () => {
  beforeEach(() => post.mockReset());

  it('requests automatic completion-rule inference', async () => {
    post.mockResolvedValue({ data: { completion_rule: { type: 'answer', source: 'auto', reason: 'summary' } } });
    await expect(
      scheduledTasksOperator.inferCompletionRule('token', {
        name: 'Daily brief',
        template: { model: 'gpt-5.5', question: 'Summarize today' }
      })
    ).resolves.toMatchObject({ type: 'answer' });
    expect(post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ action: 'infer_completion_rule', name: 'Daily brief' }),
      expect.any(Object)
    );
  });

  it('sends confirm, retry, and resume actions without deriving permissions locally', async () => {
    post
      .mockResolvedValueOnce({ data: { id: 'run-1', status: 'success' } })
      .mockResolvedValueOnce({ data: { accepted: true, run_id: 'run-2' } })
      .mockResolvedValueOnce({ data: { id: 'task-1', state: 'enabled' } });

    await scheduledTasksOperator.confirmRun('token', 'run-1', 'published', 'https://zhuanlan.zhihu.com/p/1');
    await scheduledTasksOperator.retryRun('token', 'run-1');
    await scheduledTasksOperator.resumeTask('token', 'task-1');

    expect(post.mock.calls.map(([, body]) => (body as { action: string }).action)).toEqual([
      'confirm_run',
      'retry_run',
      'resume'
    ]);
  });
});
