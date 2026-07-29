// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { IChatConversation } from '@/models';
import ConversationActions from './ConversationActions.vue';

function mountActions(conversations: IChatConversation[], dispatch = vi.fn()) {
  const wrapper = mount(ConversationActions, {
    props: { activeConversationId: 'c1' },
    global: {
      mocks: {
        $t: (key: string) => key,
        $store: {
          state: { chat: { credential: { token: 't' }, conversations } },
          dispatch
        }
      },
      stubs: {
        ElDialog: true,
        ElInput: true,
        ElButton: true,
        ShareConversationDialog: true
      }
    }
  });
  return { wrapper, dispatch };
}

describe('ConversationActions share sync', () => {
  it('writes the new share id back for a conversation the store knows', () => {
    const known = { id: 'c1', title: 'Kept' } as IChatConversation;
    const { wrapper, dispatch } = mountActions([known]);

    wrapper.vm.openShareDialog(known);
    wrapper.vm.onShareIdUpdated('share-123');

    expect(dispatch).toHaveBeenCalledWith(
      'chat/setConversation',
      expect.objectContaining({ id: 'c1', share_id: 'share-123' })
    );
  });

  it('does not dispatch for a stub row absent from the store', () => {
    // The toolbar hands us `{ id }` while the list is still loading. Dispatching
    // would unshift that stub and leave a titleless phantom row in the sidebar.
    const { wrapper, dispatch } = mountActions([]);

    wrapper.vm.openShareDialog({ id: 'c1' } as IChatConversation);
    wrapper.vm.onShareIdUpdated('share-123');

    expect(dispatch).not.toHaveBeenCalled();
  });

  it('ignores an update with no acting conversation', () => {
    const { wrapper, dispatch } = mountActions([{ id: 'c1' } as IChatConversation]);

    wrapper.vm.onShareIdUpdated('share-123');

    expect(dispatch).not.toHaveBeenCalled();
  });
});
