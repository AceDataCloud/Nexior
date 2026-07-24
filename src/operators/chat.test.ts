import { afterEach, describe, expect, it, vi } from 'vitest';
import { chatOperator } from './chat';
import type { IChatConversationResponse } from '@/models';
import { BaseError } from '@/models';
import { ERROR_CODE_CONTENT_TOO_LARGE } from '@/constants';
import { FACADE_CATALOG_DIGEST, WIRE_CONTRACT_DIGEST } from '@/generated/browserContract.generated';

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
            'data: {"type":"tool_use_commit","tool_id":"call_1","tool_name":"Bash","input":{"command":"echo hi"}}\n',
            'data: [DONE]\n'
          ])
        )
    );

    const events: IChatConversationResponse[] = [];
    await chatOperator.chatConversation({ model: 'gpt-5.6-sol', message: 'run echo hi' } as never, {
      token: 't',
      stream: (r) => events.push(r)
    });

    const progressEvents = events.filter((e) => e.type === 'tool_progress');
    expect(progressEvents).toHaveLength(2);
    expect(progressEvents.every((e) => e.tool_id === 'call_1')).toBe(true);
    const argText = progressEvents.map((e) => e.progress ?? '').join('');
    expect(argText).toBe('{"command":"echo hi"}');
    expect(events.find((e) => e.type === 'tool_use_commit')).toMatchObject({
      tool_id: 'call_1',
      input: { command: 'echo hi' }
    });
  });

  it('forwards browser execution state with a sanitized origin', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            `data: {"type":"browser_execution","tool_id":"call_browser","tool_name":"browser.read","browser_state":"executing","execution_sequence":7,"browser_session_id":"session-1","browser_call_id":"call-1","wire_contract_digest":"${WIRE_CONTRACT_DIGEST}","facade_catalog_digest":"${FACADE_CATALOG_DIGEST}","origin":"https://user:secret@example.com/private?token=hidden#fragment"}\n`,
            'data: [DONE]\n'
          ])
        )
    );

    const events: IChatConversationResponse[] = [];
    await chatOperator.chatConversation({ model: 'gpt-5.6-sol', message: 'read the page' } as never, {
      token: 't',
      stream: (response) => events.push(response)
    });

    expect(events[0]).toMatchObject({
      execution: 'browser',
      execution_state: 'executing',
      execution_sequence: 7,
      browser_session_id: 'session-1',
      browser_call_id: 'call-1',
      wire_contract_digest: WIRE_CONTRACT_DIGEST,
      facade_catalog_digest: FACADE_CATALOG_DIGEST,
      origin: 'https://example.com'
    });
    expect(events[0]).not.toHaveProperty('browser_state');
  });

  it('fails closed when either generated Browser contract digest mismatches', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            `data: {"type":"browser_execution","tool_id":"call_browser","browser_state":"executing","wire_contract_digest":"${WIRE_CONTRACT_DIGEST}","facade_catalog_digest":"sha256:stale"}\n`,
            'data: [DONE]\n'
          ])
        )
    );
    const events: IChatConversationResponse[] = [];
    await chatOperator.chatConversation({ model: 'gpt-5.6-sol', message: 'read' } as never, {
      token: 't',
      stream: (response) => events.push(response)
    });
    expect(events[0]).toMatchObject({ execution: 'browser', execution_state: 'failed' });
  });

  it('drops unsafe browser origins at the operator boundary', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            'data: {"type":"browser_execution","tool_id":"call_browser","execution":"browser","state":"failed","origin":"javascript:alert(1)"}\n',
            'data: [DONE]\n'
          ])
        )
    );

    const events: IChatConversationResponse[] = [];
    await chatOperator.chatConversation({ model: 'gpt-5.6-sol', message: 'click' } as never, {
      token: 't',
      stream: (response) => events.push(response)
    });

    expect(events[0]).toMatchObject({ execution: 'browser', execution_state: 'failed' });
    expect(events[0].origin).toBeUndefined();
  });

  it('normalizes streaming 413 request_entity_too_large errors for localized UI copy', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          sseResponse([
            'data: {"type":"error","status":413,"code":"request_entity_too_large","message":"Request payload is too large."}\n'
          ])
        )
    );

    await expect(
      chatOperator.chatConversation({ model: 'gemini-3.1-pro', message: 'describe images' } as never, { token: 't' })
    ).rejects.toMatchObject({
      status: 413,
      code: ERROR_CODE_CONTENT_TOO_LARGE,
      detail: ''
    } satisfies Partial<BaseError>);
  });
});
