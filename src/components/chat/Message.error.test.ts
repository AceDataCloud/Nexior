// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { IApplicationScope, IApplicationType, IChatMessageState } from '@/models';
import { ROUTE_CONSOLE_APPLICATION_EXTRA, ROUTE_CONSOLE_APPLICATION_SUBSCRIBE } from '@/router/constants';
import Message from './Message.vue';

const mountMessage = (
  message: Record<string, unknown>,
  {
    application = {},
    site = {},
    push = vi.fn(),
    readonly = false,
    answering = false,
    retrying = false,
    messages = [message]
  }: {
    application?: Record<string, unknown>;
    site?: Record<string, unknown>;
    push?: ReturnType<typeof vi.fn>;
    readonly?: boolean;
    answering?: boolean;
    retrying?: boolean;
    messages?: Record<string, unknown>[];
  } = {}
) =>
  shallowMount(Message, {
    props: { application, message, messages, readonly, answering, retrying },
    global: {
      mocks: {
        $t: (key: string) => key,
        $router: { push },
        $store: { state: { chat: {} }, getters: { site } }
      },
      directives: { motion: () => undefined },
      stubs: {
        ElButton: false,
        MarkdownRenderer: { props: ['content'], template: '<div class="markdown">{{ content }}</div>' }
      }
    }
  });

describe('Message failure retry', () => {
  const failure = (content = '') => ({
    role: 'assistant',
    state: IChatMessageState.FAILED,
    content,
    error: { code: 'unknown' }
  });

  it('offers a labeled retry directly in an empty-response error card', async () => {
    const message = failure();
    const wrapper = mountMessage(message);

    expect(wrapper.get('.error-card').attributes('role')).toBe('alert');
    expect(wrapper.get('.btn-retry').text()).toContain('chat.message.retry');
    await wrapper.get('.btn-retry').trigger('click');

    expect(wrapper.emitted('restart')).toEqual([[message]]);
  });

  it('keeps partial output and offers only one retry action', async () => {
    const message = failure('Partial answer');
    const wrapper = mountMessage(message);

    expect(wrapper.text()).toContain('Partial answer');
    expect(wrapper.get('.partial-error .btn-retry').text()).toContain('chat.message.retry');
    expect(wrapper.find('.btn-restart').exists()).toBe(false);
    await wrapper.get('.btn-retry').trigger('click');
    expect(wrapper.emitted('restart')).toEqual([[message]]);
  });

  it.each(['answering', 'retrying'] as const)('disables retry while %s', async (flag) => {
    const wrapper = mountMessage(failure(), { [flag]: true });

    expect(wrapper.get('.btn-retry').attributes('disabled')).toBeDefined();
    await wrapper.get('.btn-retry').trigger('click');
    expect(wrapper.emitted('restart')).toBeUndefined();
  });

  it('does not offer retry on a read-only transcript or an older failure', () => {
    const message = failure();
    expect(mountMessage(message, { readonly: true }).find('.btn-retry').exists()).toBe(false);
    const wrapper = mountMessage(message, { messages: [message, { role: 'user', content: 'Next question' }] });
    expect(wrapper.find('.btn-retry').exists()).toBe(false);
  });

  it.each(['used_up', 'not_applied'])('does not replace %s recovery with a retry', (code) => {
    const wrapper = mountMessage({ ...failure(), error: { code } });
    expect(wrapper.find('.btn-retry').exists()).toBe(false);
  });

  it.each([IChatMessageState.PENDING, IChatMessageState.ANSWERING, IChatMessageState.FINISHED])(
    'does not label a %s response as retryable',
    (state) => {
      expect(
        mountMessage({ ...failure(), state })
          .find('.btn-retry')
          .exists()
      ).toBe(false);
    }
  );
});

describe('Message partial response errors', () => {
  it('keeps streamed text visible and appends an interrupted notice', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: [{ type: 'text', text: 'Partial specification' }],
      error: { code: 'chat_error', message: 'aborted' }
    });

    expect(wrapper.text()).toContain('Partial specification');
    expect(wrapper.text()).toContain('chat.message.responseInterrupted');
    expect(wrapper.find('.partial-error').attributes('role')).toBe('alert');
    expect(wrapper.find('.error-card').exists()).toBe(false);
  });

  it.each([[''], ['   ']])('keeps the regular error card when no renderable assistant content exists', (content) => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content,
      error: { code: 'chat_error', message: 'aborted' }
    });

    expect(wrapper.find('.error-card').exists()).toBe(true);
    expect(wrapper.text()).toContain('aborted');
    expect(wrapper.find('.partial-error').exists()).toBe(false);
  });

  it('keeps non-text partial content visible', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: [{ type: 'tool_use', tool_id: 'tool-1', tool_name: 'web_search', status: 'done', is_error: true }],
      error: { code: 'stream_interrupted', message: 'The response stream ended before completion.' }
    });

    expect(wrapper.findComponent({ name: 'ToolActivity' }).exists()).toBe(true);
    expect(wrapper.find('.partial-error').exists()).toBe(true);
    expect(wrapper.find('.error-card').exists()).toBe(false);
  });

  it('shows an actionable error after partial output instead of replacing it with generic interruption copy', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: 'Partial response',
      error: { code: 'request_entity_too_large', message: 'Request payload is too large.' }
    });

    expect(wrapper.text()).toContain('Request payload is too large.');
    expect(wrapper.text()).not.toContain('chat.message.responseInterrupted');
  });

  it('keeps a user-stopped partial response without a service error notice', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: 'Partial response'
    });

    expect(wrapper.text()).toContain('Partial response');
    expect(wrapper.find('.partial-error').exists()).toBe(false);
    expect(wrapper.find('.error-card').exists()).toBe(false);
  });
});

describe('Message exhausted-credit recovery', () => {
  const rawBackendMessage = 'Please buy more in Ace Data Cloud https://platform.acedata.cloud';

  it('replaces branded backend copy in a full failure', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: '',
      error: { code: 'used_up', message: rawBackendMessage }
    });

    expect(wrapper.get('.error-card').text()).toContain('common.quotaDialog.message');
    expect(wrapper.text()).not.toContain(rawBackendMessage);
  });

  it('replaces branded backend copy while preserving partial output', () => {
    const wrapper = mountMessage({
      role: 'assistant',
      state: IChatMessageState.FAILED,
      content: 'Partial response',
      error: { code: 'used_up', message: rawBackendMessage }
    });

    expect(wrapper.text()).toContain('Partial response');
    expect(wrapper.get('.partial-error').text()).toContain('common.quotaDialog.message');
    expect(wrapper.text()).not.toContain(rawBackendMessage);
  });

  it.each([
    [IApplicationType.USAGE, ROUTE_CONSOLE_APPLICATION_EXTRA],
    [IApplicationType.PERIOD, ROUTE_CONSOLE_APPLICATION_SUBSCRIBE]
  ])('routes %s purchases inside the current site', async (type, routeName) => {
    const push = vi.fn();
    const wrapper = mountMessage(
      {
        role: 'assistant',
        state: IChatMessageState.FAILED,
        content: '',
        error: { code: 'used_up' }
      },
      {
        application: { id: 'application-1', type, scope: IApplicationScope.INDIVIDUAL },
        push
      }
    );

    await wrapper.get('.btn-topup').trigger('click');

    expect(push).toHaveBeenCalledWith({ name: routeName, params: { id: 'application-1' } });
  });

  it.each([
    [{ role: 'grantee' }, {}],
    [{}, { commerce: { recharge: { enabled: false } } }]
  ])('hides purchase when the application or site is ineligible', (applicationOverrides, site) => {
    const wrapper = mountMessage(
      {
        role: 'assistant',
        state: IChatMessageState.FAILED,
        content: '',
        error: { code: 'used_up' }
      },
      {
        application: {
          id: 'application-1',
          type: IApplicationType.USAGE,
          scope: IApplicationScope.INDIVIDUAL,
          ...applicationOverrides
        },
        site
      }
    );

    expect(wrapper.find('.btn-topup').exists()).toBe(false);
  });
});
