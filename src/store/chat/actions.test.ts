import { describe, expect, it, vi } from 'vitest';
import type { IChatConversation } from '@/models';
import { stripConversationMessages } from './summarize';
import { setConversation, getConversation } from './actions';

const heavyConversation = (id: string): IChatConversation => ({
  id,
  title: 'heavy',
  model_group: 'chatgpt',
  updated_at: 1,
  messages: [
    { role: 'assistant', content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,AAA' } }] }
  ] as any
});

describe('stripConversationMessages', () => {
  it('drops messages but keeps summary fields', () => {
    const stripped = stripConversationMessages(heavyConversation('a'));
    expect(stripped.messages).toBeUndefined();
    expect(stripped.id).toBe('a');
    expect(stripped.title).toBe('heavy');
  });

  it('returns the same object when there are no messages', () => {
    const summary: IChatConversation = { id: 'b', title: 't' };
    expect(stripConversationMessages(summary)).toBe(summary);
  });
});

describe('setConversation', () => {
  it('never stores full messages in the persisted list', async () => {
    const state: any = { conversations: [] };
    const commit = (_type: string, payload: IChatConversation[]) => {
      state.conversations = payload;
    };
    await setConversation({ commit, state }, heavyConversation('a'));
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].messages).toBeUndefined();
    expect(state.conversations[0].id).toBe('a');
  });

  it('merges into an existing summary without resurrecting messages', async () => {
    const state: any = { conversations: [{ id: 'a', title: 'old' }] };
    const commit = (_type: string, payload: IChatConversation[]) => {
      state.conversations = payload;
    };
    await setConversation({ commit, state }, { ...heavyConversation('a'), title: 'new' });
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0].title).toBe('new');
    expect(state.conversations[0].messages).toBeUndefined();
  });
});

describe('getConversation', () => {
  it('returns full messages to the caller but persists only a summary', async () => {
    const full = heavyConversation('a');
    const state: any = {
      credential: { token: 'tok' },
      conversations: [{ id: 'a', title: 'old' }]
    };
    let persisted: IChatConversation[] = [];
    const commit = (_type: string, payload: IChatConversation[]) => {
      persisted = payload;
      state.conversations = payload;
    };
    // Stub the operator call.
    const mod = await import('@/operators');
    const spy = vi.spyOn(mod.chatOperator, 'getConversation').mockResolvedValue({ data: full } as any);

    const returned = await getConversation({ commit, state } as any, 'a');

    expect(returned?.messages).toHaveLength(1); // caller gets full history
    expect(persisted[0].messages).toBeUndefined(); // store keeps only summary
    spy.mockRestore();
  });
});
