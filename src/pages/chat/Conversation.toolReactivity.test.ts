// @vitest-environment jsdom
import { shallowMount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Status } from '@/models';
import type { IChatConversationResponse, IChatMessageContentItem } from '@/models';
import Conversation from './Conversation.vue';

// Capture the SSE `stream` callback so the test can drive tool events by hand.
let capturedStream: ((r: IChatConversationResponse) => void) | undefined;

vi.mock('@/operators', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    chatOperator: {
      chatConversation: vi.fn((_body: unknown, options: { stream?: (r: IChatConversationResponse) => void }) => {
        capturedStream = options.stream;
        // Never-resolving promise: we only exercise the streaming callback, not
        // the finalizer, so the turn stays mid-stream for the assertions.
        return new Promise(() => undefined);
      })
    }
  };
});

const mountComponent = () =>
  shallowMount(Conversation, {
    global: {
      stubs: {
        Layout: { template: '<main><slot name="chat" /></main>' },
        ElSkeleton: { template: '<div><slot name="template" /></div>' },
        ElSkeletonItem: { template: '<span />' }
      },
      mocks: {
        $t: (key: string) => key,
        $route: { matched: [{ path: '/chatgpt' }], params: { id: 'c1' }, path: '/chatgpt/conversations/c1', query: {} },
        $router: { push: vi.fn(), replace: vi.fn() },
        $store: {
          commit: vi.fn(),
          dispatch: vi.fn(() => Promise.resolve(undefined)),
          getters: { authenticated: true },
          state: {
            chat: {
              application: undefined,
              applications: undefined,
              conversations: [],
              credential: { token: 't' },
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
  });

const findToolBlock = (messages: { content: unknown }[], toolId: string): IChatMessageContentItem | undefined => {
  for (const m of messages) {
    if (!Array.isArray(m.content)) continue;
    const hit = (m.content as IChatMessageContentItem[]).find((p) => p.type === 'tool_use' && p.tool_id === toolId);
    if (hit) return hit;
  }
  return undefined;
};

afterEach(() => {
  capturedStream = undefined;
  vi.clearAllMocks();
});

describe('chat/Conversation tool-block reactivity', () => {
  it('gives a settled tool block a NEW object reference so the child re-renders (no manual expand)', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      messages: { role: string; content: unknown }[];
      canceler: AbortController;
      _streamAssistantTurn: (body: unknown, token: string, id?: string) => void;
    };

    // A pending assistant slot, as the real submit path pushes before streaming.
    vm.canceler = new AbortController();
    vm.messages.push({ role: 'assistant', content: '' });
    vm._streamAssistantTurn({ id: 'c1', model: 'gpt', stateful: true }, 't', 'c1');
    await nextTick();
    expect(capturedStream).toBeTypeOf('function');

    // Tool announced → running.
    capturedStream!({
      type: 'tool_use_start',
      tool_id: 'tool-1',
      tool_name: 'code_execute'
    } as IChatConversationResponse);
    await nextTick();
    const running = findToolBlock(vm.messages, 'tool-1');
    expect(running?.status).toBe('running');

    // Tool finishes → the block is mutated in place inside the stream handler.
    // The fix must surface this as a fresh reference on the rendered content.
    capturedStream!({
      type: 'tool_result',
      tool_id: 'tool-1',
      output: 'ok',
      is_error: false,
      duration_ms: 42
    } as IChatConversationResponse);
    await nextTick();
    const settled = findToolBlock(vm.messages, 'tool-1');

    expect(settled?.status).toBe('done');
    expect(settled?.is_error).toBe(false);
    // The crux: a different object identity from the running snapshot, which is
    // what forces Vue to update the child <tool-activity> and drop the spinner.
    expect(settled).not.toBe(running);
  });

  it('surfaces a failed tool as a settled error block (new ref, is_error true)', async () => {
    const wrapper = mountComponent();
    const vm = wrapper.vm as unknown as {
      messages: { role: string; content: unknown }[];
      canceler: AbortController;
      _streamAssistantTurn: (body: unknown, token: string, id?: string) => void;
    };
    vm.canceler = new AbortController();
    vm.messages.push({ role: 'assistant', content: '' });
    vm._streamAssistantTurn({ id: 'c1', model: 'gpt', stateful: true }, 't', 'c1');
    await nextTick();

    capturedStream!({
      type: 'tool_use_start',
      tool_id: 'tool-2',
      tool_name: 'web_search'
    } as IChatConversationResponse);
    await nextTick();
    const running = findToolBlock(vm.messages, 'tool-2');

    capturedStream!({
      type: 'tool_result',
      tool_id: 'tool-2',
      output: 'boom',
      is_error: true,
      duration_ms: 7
    } as IChatConversationResponse);
    await nextTick();
    const settled = findToolBlock(vm.messages, 'tool-2');

    expect(settled?.status).toBe('done');
    expect(settled?.is_error).toBe(true);
    expect(settled).not.toBe(running);
  });
});
