import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatOperator } from './chat';
import type { IChatConversationResponse } from '@/models';

// currentSiteOrigin reads window/location; stub it so the operator can run
// under the plain test environment without touching the DOM.
vi.mock('@/utils', () => ({ currentSiteOrigin: () => '' }));

function sseResponse(lines: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(line));
      controller.close();
    }
  });
  return { ok: true, body } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('chatOperator.chatConversation SSE forwarding', () => {
  it('forwards tool_progress `progress` fragments to the stream callback', async () => {
    // The worker streams tool-call argument text as `tool_progress` events
    // while the model writes a (possibly large) tool call. Regression guard:
    // the field whitelist here must forward `progress`, or the running tool
    // block renders empty (the frozen-screen bug this fix addresses).
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            'data: {"type":"tool_use_start","tool_id":"call_1","tool_name":"Bash","input":{}}\n',
            'data: {"type":"tool_progress","tool_id":"call_1","progress":"{\\"command\\":\\""}\n',
            'data: {"type":"tool_progress","tool_id":"call_1","progress":"echo hi\\"}"}\n',
            'data: [DONE]\n'
          ])
        )
    );

    const events: IChatConversationResponse[] = [];
    await chatOperator.chatConversation({ model: 'gpt-5.5', message: 'run echo hi' } as never, {
      token: 't',
      stream: (r) => events.push(r)
    });

    const progressEvents = events.filter((e) => e.type === 'tool_progress');
    expect(progressEvents).toHaveLength(2);
    expect(progressEvents.every((e) => e.tool_id === 'call_1')).toBe(true);
    const argText = progressEvents.map((e) => e.progress ?? '').join('');
    expect(argText).toBe('{"command":"echo hi"}');
  });
});
