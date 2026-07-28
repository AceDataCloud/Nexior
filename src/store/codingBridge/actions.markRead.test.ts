// @vitest-environment jsdom
//
// The unread dot: the drawer must tell the node WHAT it rendered (so output
// appended during the round trip stays unread) and must not fire at all for a
// session that is already read.
import { describe, expect, it, vi } from 'vitest';
import createState from './state';
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
  sent.length = 0;
  const ctx = {
    state,
    commit: () => {},
    dispatch: () => {},
    rootState: { token: { access: 'tok' } }
  };
  actions.connect(ctx as never);
  return { state, ctx };
};

describe('markHistoryRead', () => {
  it('sends the rendered updated_at so a later append stays unread', () => {
    const { ctx } = harness();
    sent.length = 0;
    actions.markHistoryRead(ctx as never, {
      node_id: NODE,
      provider: 'claude',
      session_id: 's1',
      updated_at: 1_700_000_000_000
    });
    expect(sent).toEqual([
      {
        nodeId: NODE,
        payload: {
          action: 'history.mark_read',
          provider: 'claude',
          session_id: 's1',
          updated_at: 1_700_000_000_000,
          limit: 200
        }
      }
    ]);
  });

  it('is a no-op without a provider — the node keys watermarks by (provider, id)', () => {
    const { ctx } = harness();
    sent.length = 0;
    actions.markHistoryRead(
      ctx as never,
      {
        node_id: NODE,
        session_id: 's1'
      } as never
    );
    expect(sent).toEqual([]);
  });
});
