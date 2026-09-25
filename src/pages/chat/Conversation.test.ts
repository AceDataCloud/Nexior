// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { AxiosHeaders, type AxiosResponse } from 'axios';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { BaseError, IChatMessageState, Status, type IChatConversation, type IChatMessage } from '@/models';
import { chatOperator } from '@/operators';
import Message from '@/components/chat/Message.vue';
import Conversation from './Conversation.vue';

const mountComponent = ({
  credentialToken,
  fetchedConversation,
  conversationId = 'conversation-1'
}: {
  credentialToken?: string;
  fetchedConversation?: Record<string, unknown>;
  conversationId?: string | null;
} = {}) => {
  const pendingConversation = new Promise(() => undefined);
  const dispatch = vi.fn((action: string) =>
    action === 'chat/getConversation'
      ? fetchedConversation
        ? Promise.resolve(fetchedConversation)
        : pendingConversation
      : Promise.resolve(undefined)
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
            params: conversationId ? { id: conversationId } : {},
            path: `/chatgpt/conversations${conversationId ? `/${conversationId}` : ''}`,
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

describe('chat/Conversation retry', () => {
  afterEach(() => vi.restoreAllMocks());

  const updateResponse: AxiosResponse<IChatConversation> = {
    data: { id: 'conversation-1' },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: new AxiosHeaders() }
  };
  const failedMessages = (): IChatMessage[] => [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: '', state: IChatMessageState.FAILED, error: { code: 'unknown' } }
  ];
  const setup = async (conversationId: string | null = 'conversation-1') => {
    const mounted = mountComponent({
      credentialToken: 'token',
      conversationId,
      fetchedConversation: { id: conversationId, messages: [] }
    });
    await flushPromises();
    await mounted.wrapper.setData({ messages: failedMessages() });
    return mounted;
  };

  it('retries a first-byte failure without trying to update an unknown conversation ID', async () => {
    const { wrapper, dispatch } = await setup(null);
    const update = vi.spyOn(chatOperator, 'updateConversation').mockResolvedValue(updateResponse);
    const send = vi.spyOn(wrapper.vm, 'onRequest').mockResolvedValue(undefined);

    await wrapper.vm.onRestart(wrapper.vm.messages[1]);

    expect(update).not.toHaveBeenCalled();
    expect(dispatch).not.toHaveBeenCalledWith('chat/setConversation', expect.anything());
    expect(send).toHaveBeenCalledOnce();
    expect(wrapper.vm.question).toBe('Hello');
    expect(wrapper.vm.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(wrapper.vm.restarting).toBe(false);
  });

  it('preserves history, original text, and attachment identity without duplicating the user turn', async () => {
    const { wrapper } = await setup();
    const history: IChatMessage[] = [
      { role: 'user', content: 'Earlier question' },
      { role: 'assistant', content: 'Earlier answer', state: IChatMessageState.FINISHED }
    ];
    await wrapper.setData({
      messages: [
        ...history,
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Summarize' },
            {
              type: 'image_url',
              image_url: { url: 'https://example.com/photo.png' },
              name: 'photo.png',
              file_id: 'file-1',
              sha256: 'sha256:photo',
              mime: 'image/png',
              size: 1024
            },
            { type: 'file_url', file_url: 'https://example.com/report.pdf', name: 'report.pdf' },
            { type: 'text', text: 'these files' }
          ]
        },
        failedMessages()[1]
      ],
      question: 'Unrelated draft',
      references: [{ url: 'https://example.com/draft.png' }]
    });
    const update = vi.spyOn(chatOperator, 'updateConversation').mockResolvedValue(updateResponse);
    const send = vi.spyOn(wrapper.vm, 'onRequest').mockResolvedValue(undefined);

    await wrapper.vm.onRestart(wrapper.vm.messages[3]);

    expect(update).toHaveBeenCalledWith({ id: 'conversation-1', messages: history }, { token: 'token' });
    expect(send).toHaveBeenCalledOnce();
    expect(wrapper.vm.question).toBe('Summarize\nthese files');
    expect(wrapper.vm.references).toEqual([
      {
        url: 'https://example.com/photo.png',
        name: 'photo.png',
        file_id: 'file-1',
        sha256: 'sha256:photo',
        mime: 'image/png',
        size: 1024
      },
      { url: 'https://example.com/report.pdf', name: 'report.pdf' }
    ]);
    expect(wrapper.vm.messages).toHaveLength(3);
  });

  it('keeps the failure visible and blocks repeated clicks while preparing the retry', async () => {
    const { wrapper } = await setup();
    let finish: (() => void) | undefined;
    const update = vi.spyOn(chatOperator, 'updateConversation').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve(updateResponse);
        })
    );
    const send = vi.spyOn(wrapper.vm, 'onRequest').mockResolvedValue(undefined);
    const target = wrapper.vm.messages[1];

    const pending = wrapper.vm.onRestart(target);
    await wrapper.vm.onRestart(target);
    await nextTick();

    expect(update).toHaveBeenCalledOnce();
    expect(wrapper.vm.messages[1]).toBe(target);
    expect(wrapper.findAllComponents(Message)[1].props('retrying')).toBe(true);
    expect(wrapper.vm.ready).toBe(false);
    finish!();
    await pending;
    expect(send).toHaveBeenCalledOnce();
    expect(wrapper.vm.restarting).toBe(false);
  });

  it('keeps a failed history update attached to the assistant and permits another attempt', async () => {
    const { wrapper } = await setup();
    const update = vi
      .spyOn(chatOperator, 'updateConversation')
      .mockRejectedValueOnce(new BaseError(503, 'busy', 'Please retry'))
      .mockResolvedValue(updateResponse);
    const send = vi.spyOn(wrapper.vm, 'onRequest').mockResolvedValue(undefined);

    await wrapper.vm.onRestart(wrapper.vm.messages[1]);

    expect(send).not.toHaveBeenCalled();
    expect(wrapper.vm.messages[0]).toEqual({ role: 'user', content: 'Hello' });
    expect(wrapper.vm.messages[1]).toMatchObject({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      error: { code: 'busy' }
    });
    expect(wrapper.vm.restarting).toBe(false);
    await wrapper.vm.onRestart(wrapper.vm.messages[1]);
    expect(update).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenCalledOnce();
  });

  it('does not send a stale retry into a different conversation', async () => {
    const { wrapper } = await setup();
    let finish: (() => void) | undefined;
    vi.spyOn(chatOperator, 'updateConversation').mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve(updateResponse);
        })
    );
    const send = vi.spyOn(wrapper.vm, 'onRequest').mockResolvedValue(undefined);
    const pending = wrapper.vm.onRestart(wrapper.vm.messages[1]);
    await wrapper.setData({ messages: [{ role: 'user', content: 'Different conversation' }] });
    finish!();
    await pending;

    expect(send).not.toHaveBeenCalled();
    expect(wrapper.vm.messages).toEqual([{ role: 'user', content: 'Different conversation' }]);
    expect(wrapper.vm.restarting).toBe(false);
  });

  it('restores the assistant failure if send preparation rejects', async () => {
    const { wrapper } = await setup();
    vi.spyOn(chatOperator, 'updateConversation').mockResolvedValue(updateResponse);
    vi.spyOn(wrapper.vm, 'onRequest').mockRejectedValue(new Error('Local tool preparation failed'));

    await wrapper.vm.onRestart(wrapper.vm.messages[1]);

    expect(wrapper.vm.messages[0]).toEqual({ role: 'user', content: 'Hello' });
    expect(wrapper.vm.messages[1]).toMatchObject({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      error: { code: 'unknown' }
    });
    expect(wrapper.vm.restarting).toBe(false);
  });
});

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

  it('preserves a checkpointed awaiting-input pause for resume', async () => {
    const pause = {
      role: 'assistant',
      state: IChatMessageState.ANSWERING,
      content: [
        {
          type: 'tool_use',
          tool_id: 'ask-1',
          tool_name: 'ask_user_question',
          status: 'awaiting_input',
          pending_question: { questions: [] }
        }
      ]
    };
    const { wrapper } = mountComponent({
      credentialToken: 'token',
      fetchedConversation: { id: 'conversation-1', messages: [pause] }
    });
    const vm = wrapper.vm as unknown as {
      messages: any[];
      onRestoreConversation: (id: string) => Promise<void>;
    };

    await vm.onRestoreConversation('conversation-1');

    expect(vm.messages[0]).toMatchObject({
      state: IChatMessageState.ANSWERING,
      content: [{ status: 'awaiting_input', pending_question: { questions: [] } }]
    });
  });

  it('settles a checkpointed answering message when no live stream can resume it', async () => {
    const { wrapper } = mountComponent({
      credentialToken: 'token',
      fetchedConversation: {
        id: 'conversation-1',
        messages: [
          {
            role: 'assistant',
            state: IChatMessageState.ANSWERING,
            content: [
              { type: 'text', text: 'Recovered partial answer' },
              { type: 'tool_use', tool_id: 'tool-1', status: 'running' }
            ]
          }
        ]
      }
    });
    const vm = wrapper.vm as unknown as {
      messages: any[];
      onRestoreConversation: (id: string) => Promise<void>;
    };

    await vm.onRestoreConversation('conversation-1');

    expect(vm.messages[0]).toMatchObject({
      state: IChatMessageState.FAILED,
      error: { code: 'stream_interrupted' },
      content: [
        { type: 'text', text: 'Recovered partial answer' },
        { type: 'tool_use', status: 'done', is_error: true }
      ]
    });
  });
});

describe('chat/Conversation interrupted tools', () => {
  it('preserves partial content and settles unfinished tools on a service error', async () => {
    const { wrapper } = mountComponent({ credentialToken: 'token' });
    const vm = wrapper.vm as unknown as {
      messages: any[];
      handleRequestError: (error: unknown, targetIndex?: number) => Promise<void>;
    };
    vm.messages = [
      {
        role: 'assistant',
        state: IChatMessageState.ANSWERING,
        content: [
          { type: 'text', text: 'Partial answer' },
          {
            type: 'tool_use',
            tool_id: 'tool-1',
            status: 'running',
            pending_question: { questions: [] },
            pending_consent_request: { consent_request_id: 'consent-1', requirements: [] },
            pending_action_confirmation: { title: 'Publish', action: 'publish' }
          }
        ]
      }
    ];

    await vm.handleRequestError(new BaseError(500, 'stream_interrupted', 'stream ended'), 0);

    expect(vm.messages[0]).toMatchObject({
      state: IChatMessageState.FAILED,
      error: { code: 'stream_interrupted', message: 'stream ended' },
      content: [
        { type: 'text', text: 'Partial answer' },
        {
          type: 'tool_use',
          status: 'done',
          is_error: true
        }
      ]
    });
    expect(vm.messages[0].content[1]).not.toHaveProperty('pending_question');
    expect(vm.messages[0].content[1]).toMatchObject({
      pending_consent_request: { consent_request_id: 'consent-1' },
      pending_action_confirmation: { title: 'Publish' }
    });
  });

  it('drops backend recharge copy from exhausted-credit errors', async () => {
    const { wrapper } = mountComponent({ credentialToken: 'token' });
    const vm = wrapper.vm as unknown as {
      messages: any[];
      handleRequestError: (error: unknown, targetIndex?: number) => Promise<void>;
    };
    vm.messages = [{ role: 'assistant', state: IChatMessageState.ANSWERING }];

    await vm.handleRequestError(
      new BaseError(403, 'used_up', 'Please buy more in Ace Data Cloud https://platform.acedata.cloud'),
      0
    );

    expect(vm.messages[0]).toMatchObject({
      state: IChatMessageState.FAILED,
      error: { code: 'used_up' }
    });
    expect(vm.messages[0].error).not.toHaveProperty('message');
  });

  it('settles a user-stopped browser tool without attaching a service error', async () => {
    const { wrapper } = mountComponent({ credentialToken: 'token' });
    const vm = wrapper.vm as unknown as {
      messages: any[];
      handleRequestError: (error: unknown, targetIndex?: number) => Promise<void>;
    };
    vm.messages = [
      {
        role: 'assistant',
        state: IChatMessageState.ANSWERING,
        content: [
          { type: 'text', text: 'Partial answer' },
          { type: 'tool_use', tool_id: 'tool-1', status: 'running', execution: 'browser' }
        ]
      }
    ];

    await vm.handleRequestError(new DOMException('Stopped', 'AbortError'), 0);

    expect(vm.messages[0]).toMatchObject({
      state: IChatMessageState.FAILED,
      content: [
        { type: 'text', text: 'Partial answer' },
        { type: 'tool_use', status: 'done', is_error: true, execution_state: 'stopped' }
      ]
    });
    expect(vm.messages[0].error).toBeUndefined();
  });
});
