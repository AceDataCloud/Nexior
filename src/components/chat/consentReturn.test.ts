import { describe, expect, it } from 'vitest';
import { buildAuthorizedConsentOutput, findPendingConsentBlock, parseConsentReturnFromQuery } from './consentReturn';
import { ROLE_ASSISTANT, ROLE_USER } from '@/constants/chat';
import type { IChatMessage, IConsentRequestPayload } from '@/models';

const PAYLOAD: IConsentRequestPayload = {
  consent_request_id: 'consent_abc',
  requirements: [
    {
      requirement_index: 0,
      match: 'any',
      satisfied: false,
      entries: [
        { connector: 'acedatacloud/gmail', status: 'unconnected', install_url: 'https://x/g' },
        { connector: 'acedatacloud/outlook', status: 'unconnected', install_url: 'https://x/o' }
      ]
    }
  ]
};

function awaitingBlock(toolUseId: string, payload: IConsentRequestPayload) {
  return {
    type: 'tool_use' as const,
    tool_id: toolUseId,
    tool_name: 'get_connector_status',
    status: 'awaiting_input' as const,
    pending_consent_request: payload
  };
}

describe('parseConsentReturnFromQuery', () => {
  it('extracts both params when present', () => {
    expect(parseConsentReturnFromQuery({ consent: 'consent_abc', connector: 'acedatacloud/gmail' })).toEqual({
      consentRequestId: 'consent_abc',
      connector: 'acedatacloud/gmail'
    });
  });

  it('returns null when either param is missing', () => {
    expect(parseConsentReturnFromQuery({ consent: 'x' })).toBeNull();
    expect(parseConsentReturnFromQuery({ connector: 'y' })).toBeNull();
    expect(parseConsentReturnFromQuery({})).toBeNull();
  });

  it('returns null on empty / whitespace values', () => {
    expect(parseConsentReturnFromQuery({ consent: '', connector: 'y' })).toBeNull();
    expect(parseConsentReturnFromQuery({ consent: '   ', connector: 'y' })).toBeNull();
  });

  it('unwraps the first entry of an array-shaped query value', () => {
    expect(
      parseConsentReturnFromQuery({
        consent: ['consent_abc', 'consent_other'],
        connector: ['acedatacloud/gmail']
      })
    ).toEqual({ consentRequestId: 'consent_abc', connector: 'acedatacloud/gmail' });
  });

  it('ignores non-string types', () => {
    // @ts-expect-error — intentionally pass invalid value shapes
    expect(parseConsentReturnFromQuery({ consent: 123, connector: 'y' })).toBeNull();
    expect(parseConsentReturnFromQuery({ consent: null, connector: undefined })).toBeNull();
  });
});

describe('findPendingConsentBlock', () => {
  it('returns the toolUseId + payload when the latest assistant has an awaiting block', () => {
    const messages: IChatMessage[] = [
      { role: ROLE_USER, content: 'send mail' },
      {
        role: ROLE_ASSISTANT,
        content: [{ type: 'text', text: 'Need consent' }, awaitingBlock('tool_xyz', PAYLOAD)]
      }
    ];
    expect(findPendingConsentBlock(messages, 'consent_abc')).toEqual({
      toolUseId: 'tool_xyz',
      payload: PAYLOAD
    });
  });

  it('returns null when consent_request_id mismatches', () => {
    const messages: IChatMessage[] = [
      {
        role: ROLE_ASSISTANT,
        content: [awaitingBlock('tool_xyz', PAYLOAD)]
      }
    ];
    expect(findPendingConsentBlock(messages, 'consent_other')).toBeNull();
  });

  it('returns null when the block is already done', () => {
    const messages: IChatMessage[] = [
      {
        role: ROLE_ASSISTANT,
        content: [
          {
            type: 'tool_use',
            tool_id: 'tool_xyz',
            tool_name: 'get_connector_status',
            status: 'done',
            pending_consent_request: PAYLOAD,
            output: '{}'
          }
        ]
      }
    ];
    expect(findPendingConsentBlock(messages, 'consent_abc')).toBeNull();
  });

  it('returns null when the tool name does not match', () => {
    const messages: IChatMessage[] = [
      {
        role: ROLE_ASSISTANT,
        content: [
          {
            type: 'tool_use',
            tool_id: 'tool_xyz',
            tool_name: 'ask_user_question',
            status: 'awaiting_input'
          }
        ]
      }
    ];
    expect(findPendingConsentBlock(messages, 'consent_abc')).toBeNull();
  });

  it('only inspects the latest assistant message', () => {
    // An older assistant turn carries the awaiting block (shouldn't
    // happen by the worker contract — only the tail can be awaiting —
    // but we lock the invariant so a misbehaving server can't pull a
    // stale block into a resumed turn).
    const messages: IChatMessage[] = [
      {
        role: ROLE_ASSISTANT,
        content: [awaitingBlock('tool_old', PAYLOAD)]
      },
      { role: ROLE_USER, content: 'next' },
      { role: ROLE_ASSISTANT, content: [{ type: 'text', text: 'Done' }] }
    ];
    expect(findPendingConsentBlock(messages, 'consent_abc')).toBeNull();
  });

  it('returns null for an empty messages array', () => {
    expect(findPendingConsentBlock([], 'consent_abc')).toBeNull();
  });
});

describe('buildAuthorizedConsentOutput', () => {
  it('marks one connector authorized and leaves skipped empty', () => {
    const raw = buildAuthorizedConsentOutput(PAYLOAD, 'acedatacloud/gmail');
    expect(JSON.parse(raw)).toEqual({
      consent_request_id: 'consent_abc',
      authorized: ['acedatacloud/gmail'],
      skipped: []
    });
  });

  it('echoes the consent_request_id verbatim', () => {
    const payload: IConsentRequestPayload = {
      consent_request_id: 'consent_other-id_42',
      requirements: []
    };
    const raw = buildAuthorizedConsentOutput(payload, 'acedatacloud/slack');
    expect(JSON.parse(raw)).toEqual({
      consent_request_id: 'consent_other-id_42',
      authorized: ['acedatacloud/slack'],
      skipped: []
    });
  });
});
