import { describe, expect, it } from 'vitest';
import { ROLE_USER } from '@/constants/chat';
import { hasLoadedConversationMessages } from './conversationRestore';

describe('hasLoadedConversationMessages', () => {
  it('requires a non-empty messages array', () => {
    expect(hasLoadedConversationMessages(undefined)).toBe(false);
    expect(hasLoadedConversationMessages({ id: 'conv_1' })).toBe(false);
    expect(hasLoadedConversationMessages({ id: 'conv_1', messages: [] })).toBe(false);
    expect(
      hasLoadedConversationMessages({
        id: 'conv_1',
        messages: [{ role: ROLE_USER, content: 'hello' }]
      })
    ).toBe(true);
  });
});
