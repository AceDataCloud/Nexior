import { describe, expect, it } from 'vitest';
import type { IChatMessage } from '@/models';
import { hasSubmittedAsyncTask } from './asyncTaskRecovery';

const history = (output: string): IChatMessage[] => [
  { role: 'user', content: 'draw a car' },
  {
    role: 'assistant',
    content: [
      { type: 'tool_use', tool_id: 'call', tool_name: 'mcp__OpenAI__openai_generate_image', status: 'done', output }
    ]
  }
];
const output = JSON.stringify({
  task_id: 'original',
  mcp_async_submission: { task_id: 'original', poll_tool: 'openai_get_task' }
});
describe('async task recovery detection', () => {
  it('finds accepted jobs across assistant tool turns', () => {
    expect(hasSubmittedAsyncTask([...history(output), { role: 'assistant', content: '' }])).toBe(true);
  });
  it('does not confuse earlier generations with the latest question', () => {
    expect(
      hasSubmittedAsyncTask([
        ...history(output),
        { role: 'user', content: 'new question' },
        { role: 'assistant', content: '' }
      ])
    ).toBe(false);
  });
  it.each([
    'not JSON',
    'null',
    '{"task_id":"not-confirmed"}',
    JSON.stringify({ task_id: 'a', mcp_async_submission: { task_id: 'a', poll_tool: 'openai_generate_image' } })
  ])('rejects invalid submission evidence: %s', (value) => {
    expect(hasSubmittedAsyncTask(history(value))).toBe(false);
  });
});
