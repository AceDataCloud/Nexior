// @vitest-environment jsdom
import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { IChatMessageState, Status, type IChatConversationOptions, type IChatConversationResponse } from '@/models';
import Conversation from './Conversation.vue';
import { CHAT_MODEL_GPT_6_ASTRA } from '@/constants';

const { chat } = vi.hoisted(() => ({ chat: vi.fn() }));
vi.mock('@/operators', async (original) => ({
  ...(await original<object>()),
  chatOperator: { chatConversation: chat }
}));
vi.mock('@/utils/surface', async (original) => ({ ...(await original<object>()), supportsClientTools: () => true }));

function mount() {
  const route = reactive({
    matched: [{ path: '/chatgpt' }],
    params: { id: 'c1' },
    path: '/chatgpt/conversations/c1',
    query: {}
  });
  const getters = reactive({ authenticated: true, user: { id: 'u1' } });
  const wrapper = shallowMount(Conversation, {
    global: {
      stubs: { Layout: { template: '<main><slot name="chat" /></main>' } },
      mocks: {
        $t: (key: string) => key,
        $route: route,
        $router: { push: vi.fn(), replace: vi.fn() },
        $store: {
          commit: vi.fn(),
          dispatch: vi.fn(() => Promise.resolve(undefined)),
          getters,
          state: {
            chat: {
              application: { id: 'app' },
              credential: { id: 'cred', token: 'token' },
              conversations: [],
              model: { name: 'gpt' },
              status: { getApplications: Status.None }
            }
          }
        }
      }
    }
  });
  return { wrapper, route, getters };
}

let active: ReturnType<typeof mount>;
const requests: { options: IChatConversationOptions; finish: () => void; body: unknown }[] = [];

beforeEach(async () => {
  requests.length = 0;
  chat.mockReset().mockImplementation(
    (body, options) =>
      new Promise<void>((resolve) => {
        requests.push({ body, options, finish: resolve });
      })
  );
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ features: [] }) }))
  );
  vi.spyOn(ElMessage, 'error').mockImplementation(() => ({ close: vi.fn() }));
  sessionStorage.clear();
  active = mount();
  await flushPromises();
});
afterEach(() => {
  active.wrapper.unmount();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function start() {
  const vm = active.wrapper.vm;
  vm.runtimeConnectionIds = ['selected'];
  vm.messages = [{ role: 'assistant', content: '', state: IChatMessageState.PENDING }];
  vm.canceler = new AbortController();
  vm._streamAssistantTurn({ question: 'task', model: CHAT_MODEL_GPT_6_ASTRA.name }, 'token', 'c1');
  return vm;
}
function emit(index: number, response: Partial<IChatConversationResponse>) {
  requests[index].options.stream!({ id: 'c1', answer: '', delta_answer: '', ...response });
}
async function pause(kind: 'ask_user_question' | 'consent_request' | 'action_confirmation') {
  emit(0, { type: 'tool_use_start', tool_id: 'question', tool_name: kind });
  emit(0, { type: kind, tool_id: 'question', payload: {} as IChatConversationResponse['payload'] });
  requests[0].finish();
  await flushPromises();
}

describe('bounded task connector authorization', () => {
  it.each(['ask_user_question', 'consent_request', 'action_confirmation'] as const)(
    'keeps account selection and deadline after %s, then clears on terminal completion',
    async (kind) => {
      const vm = start();
      const first = requests[0].options.connectorAuthorization;
      await pause(kind);
      expect(vm.taskConnectionAuthorization?.connectionIds).toEqual(['selected']);
      vm._resumeWithToolResults([{ tool_use_id: 'question', output: 'yes' }]);
      expect(requests[1].options.connectorAuthorization).toEqual(first);
      expect(JSON.stringify(requests[1].body)).not.toContain('selected');
      requests[1].finish();
      await flushPromises();
      expect(vm.taskConnectionAuthorization).toBeNull();
    }
  );

  it('keeps authorization through automatic client-tool continuation', async () => {
    const vm = start();
    vi.spyOn(vm, '_runClientTools').mockImplementation(async () => {
      vm._resumeWithToolResults([{ tool_use_id: 'client', output: 'done' }], 'c1');
    });
    emit(0, { type: 'tool_use_start', tool_id: 'client', tool_name: 'fs_read_file', execution: 'client' });
    requests[0].finish();
    await flushPromises();
    expect(requests).toHaveLength(2);
    expect(requests[1].options.connectorAuthorization).toEqual(requests[0].options.connectorAuthorization);
  });

  it('does not inherit authorization for a new independent question', async () => {
    const vm = start();
    await pause('ask_user_question');
    vm.messages.push({ role: 'assistant', content: '', state: IChatMessageState.PENDING });
    vm._streamAssistantTurn({ question: 'new task', model: CHAT_MODEL_GPT_6_ASTRA.name }, 'token', 'c1');
    expect(requests[1].options.connectorAuthorization).toBeUndefined();
  });

  it('does not silently resume after expiry; fresh user selection authorizes a new interval', async () => {
    const vm = start();
    await pause('ask_user_question');
    vm.taskConnectionAuthorization!.expiresAt = new Date(Date.now() - 1).toISOString();
    vm._resumeWithToolResults([{ tool_use_id: 'question', output: 'yes' }]);
    expect(requests).toHaveLength(1);
    expect(ElMessage.error).toHaveBeenCalledWith('chat.runtime.reauthorize');
    expect(vm.messages.at(-1)?.content).toEqual(
      expect.arrayContaining([expect.objectContaining({ status: 'awaiting_input' })])
    );
    vm.runtimeConnectionIds = ['selected'];
    vm.continueConnectionTask();
    expect(requests).toHaveLength(2);
    expect(Date.parse(requests[1].options.connectorAuthorization!.expiresAt!)).toBeGreaterThan(Date.now());
  });

  it('requires reauthorization after a full-page OAuth return loses in-memory state', () => {
    const vm = active.wrapper.vm;
    sessionStorage.setItem(vm.connectionResumeMarker(), 'required');
    vm._resumeWithToolResults([{ tool_use_id: 'consent', output: 'authorized' }]);
    expect(chat).not.toHaveBeenCalled();
    expect(ElMessage.error).toHaveBeenCalledWith('chat.runtime.reauthorize');
  });

  it('requires reauthorization after reloading a paused protected task', async () => {
    const vm = start();
    await pause('ask_user_question');
    expect(sessionStorage.getItem(vm.connectionResumeMarker())).toBe('required');
    vm.taskConnectionAuthorization = null;
    vm._resumeWithToolResults([{ tool_use_id: 'question', output: 'yes' }]);
    expect(requests).toHaveLength(1);
    expect(ElMessage.error).toHaveBeenCalledWith('chat.runtime.reauthorize');
  });

  it('preserves authorization while pinning a new chat to its first conversation URL', async () => {
    const vm = start();
    vm.skipNextRestoreId = 'new-conversation';
    active.route.params.id = 'new-conversation';
    await flushPromises();
    expect(vm.taskConnectionAuthorization?.connectionIds).toEqual(['selected']);
  });

  it.each(['stop', 'reset', 'user-switch', 'navigation'] as const)('clears the task on %s', async (action) => {
    const vm = start();
    if (action === 'stop') await vm.onStop();
    if (action === 'reset') vm.resetConversation();
    if (action === 'user-switch') active.getters.user.id = 'u2';
    if (action === 'navigation') active.route.params.id = 'c2';
    await flushPromises();
    expect(vm.taskConnectionAuthorization).toBeNull();
    expect(vm.runtimeConnectionIds).toEqual([]);
  });
});
