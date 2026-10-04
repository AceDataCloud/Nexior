import type { IChatMessage } from '@/models';

/** Accepted jobs survive a failed model response. Never erase them to regenerate the question. */
export function hasSubmittedAsyncTask(messages: IChatMessage[]): boolean {
  let lastUser = messages.length - 1;
  while (lastUser >= 0 && messages[lastUser].role !== 'user') lastUser--;
  if (lastUser < 0) return false;
  return messages.slice(lastUser + 1).some((message) => {
    if (message.role !== 'assistant' || !Array.isArray(message.content)) return false;
    return message.content.some((block) => {
      if (block.type !== 'tool_use' || block.status !== 'done' || block.is_error || typeof block.output !== 'string')
        return false;
      if (!/^mcp__[a-zA-Z0-9_]+?__[a-zA-Z0-9_]+$/.test(block.tool_name ?? '')) return false;
      try {
        const result = JSON.parse(block.output);
        const submission = result?.mcp_async_submission;
        return (
          typeof result?.task_id === 'string' &&
          !!result.task_id &&
          result.task_id.length <= 200 &&
          submission?.task_id === result.task_id &&
          typeof submission.poll_tool === 'string' &&
          /^[a-zA-Z0-9_]+_get_task$/.test(submission.poll_tool)
        );
      } catch {
        return false;
      }
    });
  });
}
