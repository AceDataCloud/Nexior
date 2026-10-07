import { beforeEach, describe, expect, it, vi } from 'vitest';
import { registry } from '../local/registry';
import { api } from './api';
import { executeRun } from './runner';

vi.mock('../local/registry', () => ({ registry: { specs: vi.fn(), invoke: vi.fn() } }));
vi.mock('./api', () => ({ api: { chat: vi.fn() } }));

describe('local scheduled run turn budget', () => {
  beforeEach(() => {
    vi.mocked(api.chat).mockReset();
    vi.mocked(registry.specs).mockReturnValue([
      { name: 'fs.read_file', description: 'Read a file', input_schema: { type: 'object' } }
    ] as ReturnType<typeof registry.specs>);
    vi.mocked(registry.invoke).mockResolvedValue({ output: 'file content' });
  });

  it('keeps the 500-turn budget and run identity through a local tool resume', async () => {
    vi.mocked(api.chat)
      .mockResolvedValueOnce({
        id: 'conversation-1',
        pending_client_tools: [{ tool_use_id: 'call-1', name: 'fs_read_file', input: {} }]
      })
      .mockResolvedValueOnce({ id: 'conversation-1', answer: 'done', terminal_reason: 'completed' });

    const result = await executeRun(
      {
        run_id: 'run-1',
        conversation_id: 'conversation-1',
        question: 'Read the file',
        model: 'gpt-6.1-sol',
        max_turns: 500,
        unattended_policy: { allowed_skills: [], allowed_local_tools: ['fs.read_file'] }
      },
      { scheduledTaskId: 'task-1' }
    );

    expect(result.answer).toBe('done');
    expect(api.chat).toHaveBeenCalledTimes(2);
    expect(api.chat).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'conversation-1' }), undefined);
    expect(api.chat).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        max_turns: 500,
        metadata: { source: 'scheduled_task', scheduled_task_id: 'task-1', run_id: 'run-1' }
      }),
      undefined
    );
  });
});
