import { describe, expect, it } from 'vitest';
import {
  buildAuthorizedConsentOutput,
  findPendingConsentBlock,
  parseConsentReturnFromQuery,
  repairInstallReturnToUrl
} from './consentReturn';
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
        { connector: 'acedatacloud/gmail', catalog_id: 'cat_gmail', status: 'unconnected', install_url: 'https://x/g' },
        {
          connector: 'acedatacloud/outlook',
          catalog_id: 'cat_outlook',
          status: 'unconnected',
          install_url: 'https://x/o'
        }
      ]
    }
  ]
};

function awaitingBlock(toolUseId: string, payload: IConsentRequestPayload) {
  return {
    type: 'tool_use' as const,
    tool_id: toolUseId,
    tool_name: 'request_user_consent',
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
            tool_name: 'request_user_consent',
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

describe('repairInstallReturnToUrl', () => {
  const worker = (returnTo: string) =>
    `https://auth.acedata.cloud/connections/install/cat_1?return_to=${encodeURIComponent(returnTo)}`;

  it('rewrites the broken /chat/c/<id> path to the current group conversation route', () => {
    const url = worker('https://studio.acedata.cloud/chat/c/conv-123?consent=consent_abc');
    const fixed = new URL(repairInstallReturnToUrl(url, '/chatgpt'));
    const ret = new URL(fixed.searchParams.get('return_to') as string);
    expect(ret.origin + ret.pathname).toBe('https://studio.acedata.cloud/chatgpt/conversations/conv-123');
    // The consent beacon (the only carrier of the consent id) is preserved.
    expect(ret.searchParams.get('consent')).toBe('consent_abc');
  });

  it('preserves every query param on the worker return_to (e.g. connector)', () => {
    const url = worker('https://studio.acedata.cloud/chat/c/conv-9?consent=consent_x&connector=medium%2Fmedium');
    const ret = new URL(new URL(repairInstallReturnToUrl(url, '/claude')).searchParams.get('return_to') as string);
    expect(ret.pathname).toBe('/claude/conversations/conv-9');
    expect(ret.searchParams.get('consent')).toBe('consent_x');
    expect(ret.searchParams.get('connector')).toBe('medium/medium');
  });

  it('returns the URL unchanged when there is no return_to param', () => {
    const url = 'https://auth.acedata.cloud/connections/install/cat_1';
    expect(repairInstallReturnToUrl(url, '/chatgpt')).toBe(url);
  });

  it('leaves an already-valid (non /chat/c/) return_to untouched', () => {
    const url = worker('https://studio.acedata.cloud/chatgpt/conversations/conv-1?consent=consent_abc');
    expect(repairInstallReturnToUrl(url, '/chatgpt')).toBe(url);
  });

  it('returns the URL unchanged when groupPrefix is empty', () => {
    const url = worker('https://studio.acedata.cloud/chat/c/conv-123?consent=consent_abc');
    expect(repairInstallReturnToUrl(url, '')).toBe(url);
  });

  it('returns the input unchanged when it is not a parseable URL', () => {
    expect(repairInstallReturnToUrl('not a url', '/chatgpt')).toBe('not a url');
  });
});
