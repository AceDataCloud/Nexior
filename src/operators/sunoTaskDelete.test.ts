import { expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ post: vi.fn().mockResolvedValue({ data: { deleted: true } }) }));
vi.mock('axios', () => ({ default: { post: mocks.post } }));
import { sunoOperator } from './suno';
import { BaseTaskOperator } from './baseTaskOperator';

it('uses the same task delete implementation as GPT Image on the existing Suno endpoint', async () => {
  expect(sunoOperator.delete).toBe(BaseTaskOperator.prototype.delete);
  await sunoOperator.delete('generation-1', { token: 'test-token', userId: 'owner' });
  expect(mocks.post).toHaveBeenCalledWith(
    '/suno/tasks',
    { action: 'delete', id: 'generation-1', user_id: 'owner', application_id: undefined },
    expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer test-token' }) })
  );
});
