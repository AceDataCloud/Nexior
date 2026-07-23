// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { describe, expect, it, vi } from 'vitest';

import { Status } from '@/models';
import Conversation from './Conversation.vue';

const mountComponent = ({ credentialToken }: { credentialToken?: string } = {}) => {
  const pendingConversation = new Promise(() => undefined);
  const dispatch = vi.fn((action: string) =>
    action === 'chat/getConversation' ? pendingConversation : Promise.resolve(undefined)
  );
  return {
    dispatch,
    wrapper: shallowMount(Conversation, {
      global: {
        stubs: {
          Layout: { template: '<main><slot name="chat" /></main>' },
          ElSkeleton: { template: '<div><slot name="template" /></div>' },
          ElSkeletonItem: { template: '<span />' }
        },
        mocks: {
          $t: (key: string) => (key === 'common.status.loading' ? 'Loading...' : key),
          $route: {
            matched: [{ path: '/chatgpt' }],
            params: { id: 'conversation-1' },
            path: '/chatgpt/conversations/conversation-1',
            query: {}
          },
          $router: {
            push: vi.fn(),
            replace: vi.fn()
          },
          $store: {
            commit: vi.fn(),
            dispatch,
            getters: { authenticated: !!credentialToken },
            state: {
              chat: {
                application: undefined,
                applications: undefined,
                conversations: [],
                credential: credentialToken ? { token: credentialToken } : undefined,
                memoryEnabled: true,
                model: undefined,
                modelGroup: undefined,
                service: undefined,
                status: { getApplications: Status.None }
              }
            }
          }
        }
      }
    })
  };
};

describe('chat/Conversation loading state', () => {
  it('shows a status skeleton instead of the centered empty layout while history restores', async () => {
    const { dispatch, wrapper } = mountComponent({ credentialToken: 'token' });
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledWith('chat/getConversation', 'conversation-1'));

    const loading = wrapper.get('.conversation-loading');
    expect(loading.attributes('role')).toBe('status');
    expect(loading.attributes('aria-label')).toBe('Loading...');
    expect(wrapper.find('.conversation-loading-label').exists()).toBe(false);
    expect(wrapper.find('.conversation-loading-spinner').exists()).toBe(false);
    expect(wrapper.get('.dialogue').classes()).not.toContain('empty');
    expect((wrapper.vm as unknown as { ready: boolean }).ready).toBe(false);

    await wrapper.setData({ messages: [{ role: 'user', content: 'stale conversation' }] });
    void (wrapper.vm as unknown as { onRestoreConversation: (id: string) => Promise<void> }).onRestoreConversation(
      'conversation-1'
    );
    await nextTick();
    expect((wrapper.vm as unknown as { messages: unknown[] }).messages).toEqual([]);

    (wrapper.vm as unknown as { resetConversation: () => void }).resetConversation();
    await nextTick();

    expect(wrapper.find('.conversation-loading').exists()).toBe(false);
    expect(wrapper.get('.dialogue').classes()).toContain('empty');
  });

  it('does not leave a guest direct link in an infinite loading state', () => {
    const { wrapper } = mountComponent();

    expect(wrapper.find('.conversation-loading').exists()).toBe(false);
    expect(wrapper.get('.dialogue').classes()).toContain('empty');
  });
});
