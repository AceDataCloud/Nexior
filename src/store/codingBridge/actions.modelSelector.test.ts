// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import createState from './state';
import mutations from './mutations';
import type { ICodingBridgeState } from './models';

vi.mock('@/utils/codingBridgeNotify', () => ({
  notifyPermissionLocally: () => {},
  subscribeWebPush: async () => null,
  unsubscribeWebPush: async () => null,
  registerNativePush: async () => null,
  requestWebPermission: async () => 'granted'
}));

const sent: Array<{ nodeId: string; payload: Record<string, unknown> }> = [];
vi.mock('@/utils/codingBridgeSocket', () => ({
  CodingBridgeSocket: class {
    isOpen = true;
    connect() {}
    sendToNode(nodeId: string, payload: Record<string, unknown>) {
      sent.push({ nodeId, payload });
    }
    resume() {}
    close() {}
  }
}));

const actions = await import('./actions');
const NODE = 'node-1';

const harness = () => {
  const state: ICodingBridgeState = createState();
  const commit = (type: string, payload?: unknown): void => {
    const fn = (mutations as Record<string, (s: ICodingBridgeState, p: unknown) => void>)[type];
    if (!fn) throw new Error(`unknown mutation: ${type}`);
    fn(state, payload);
  };
  const ctx = {
    state,
    commit,
    dispatch: () => {},
    rootState: { token: { access: 'tok' } }
  };
  actions.connect(ctx as never);
  sent.length = 0;
  return { state, ctx, commit };
};

beforeEach(() => {
  sent.length = 0;
});

describe('Coding Bridge model selector contract', () => {
  it('resumes with the exact selector rather than the resolved model id', () => {
    const { state, ctx, commit } = harness();
    commit('upsertSession', {
      session_id: 's1',
      node_id: NODE,
      status: 'idle',
      provider: 'claude',
      model: 'opus[1m]',
      resolved_model: 'claude-opus-5',
      started: false
    });
    commit('setCurrentNode', NODE);
    commit('setCurrentSession', 's1');

    actions.sendPrompt(ctx as never, { prompt: 'continue' });
    expect(sent.at(-1)?.payload).toMatchObject({
      action: 'session.start',
      session_id: 's1',
      model: 'opus[1m]',
      resume_session_id: 's1'
    });
    expect(sent.at(-1)?.payload.model).toBe('opus[1m]');
    expect(sent.at(-1)?.payload.model).not.toBe('claude-opus-5');
    expect(state.sessions.s1.model).toBe('opus[1m]');
  });

  it('omits the model override when selector provenance is unknown', () => {
    const { ctx, commit } = harness();
    commit('setLastComposer', { node_id: NODE, prefs: { model: 'opus[1m]' } });
    commit('upsertSession', {
      session_id: 'legacy',
      node_id: NODE,
      status: 'idle',
      provider: 'claude',
      resolved_model: 'claude-opus-5',
      started: false
    });
    commit('setCurrentNode', NODE);
    commit('setCurrentSession', 'legacy');

    actions.sendPrompt(ctx as never, { prompt: 'continue' });
    expect(sent.at(-1)?.payload).toMatchObject({
      action: 'session.start',
      session_id: 'legacy',
      resume_session_id: 'legacy'
    });
    expect(sent.at(-1)?.payload.model).toBeUndefined();
    expect(sent.at(-1)?.payload.model).toBeUndefined();
  });
});
