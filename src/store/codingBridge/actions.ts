import { ActionContext } from 'vuex';
import { codingBridgeOperator } from '@/operators';
import { ICodingBridgeState } from './models';
import { IRootState } from '../common/models';
import { Status, ICodingBridgeEvent, ICodingBridgeEventKind, ICodingBridgeNode } from '@/models';
import { CodingBridgeSocket } from '@/utils/codingBridgeSocket';
import {
  CB_ACTION_SESSION_START,
  CB_ACTION_SESSION_SEND,
  CB_ACTION_SESSION_INTERRUPT,
  CB_ACTION_SESSION_CLOSE,
  CB_ACTION_PERMISSION_RESOLVE,
  CB_EVENT_SESSION_STARTED,
  CB_EVENT_SESSION_TEXT,
  CB_EVENT_SESSION_THINKING,
  CB_EVENT_SESSION_TOOL_USE,
  CB_EVENT_SESSION_TOOL_RESULT,
  CB_EVENT_PERMISSION_REQUEST,
  CB_EVENT_PERMISSION_RESOLVED,
  CB_EVENT_SESSION_RESULT,
  CB_EVENT_SESSION_ERROR,
  CB_EVENT_SESSION_CLOSED,
  CB_EVENT_SESSIONS_SNAPSHOT
} from '@/constants';

// The live WebSocket is intentionally kept OUT of Vuex state (it is not
// serialisable and must survive `vuex-persistedstate`). It is a module-level
// singleton owned by the actions that open and close it.
let socket: CodingBridgeSocket | undefined;

const uid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '');
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
};

const makeEvent = (
  sessionId: string,
  kind: ICodingBridgeEventKind,
  fields: Partial<ICodingBridgeEvent>
): ICodingBridgeEvent => ({
  id: uid(),
  session_id: sessionId,
  kind,
  ts: Date.now(),
  ...fields
});

// Translate one inner node event into the matching mutation(s).
const applyNodeEvent = (
  commit: ActionContext<ICodingBridgeState, IRootState>['commit'],
  payload: Record<string, any>,
  fromNode: string | undefined
): void => {
  const event = payload?.event;
  const sessionId = payload?.session_id;
  switch (event) {
    case CB_EVENT_SESSION_STARTED:
      commit('upsertSession', {
        session_id: sessionId,
        node_id: fromNode,
        status: 'idle',
        cwd: payload.cwd,
        model: payload.model
      });
      break;
    case CB_EVENT_SESSION_TEXT:
      commit('appendEvent', makeEvent(sessionId, 'text', { text: payload.text }));
      break;
    case CB_EVENT_SESSION_THINKING:
      commit('appendEvent', makeEvent(sessionId, 'thinking', { text: payload.text }));
      break;
    case CB_EVENT_SESSION_TOOL_USE:
      commit(
        'appendEvent',
        makeEvent(sessionId, 'tool_use', {
          tool: payload.tool,
          tool_use_id: payload.tool_use_id,
          input: payload.input
        })
      );
      break;
    case CB_EVENT_SESSION_TOOL_RESULT:
      commit(
        'appendEvent',
        makeEvent(sessionId, 'tool_result', {
          tool_use_id: payload.tool_use_id,
          content: payload.content,
          is_error: payload.is_error
        })
      );
      break;
    case CB_EVENT_PERMISSION_REQUEST:
      commit('addPermission', {
        request_id: payload.request_id,
        session_id: sessionId,
        node_id: fromNode,
        tool: payload.tool,
        input: payload.input,
        title: payload.title,
        display_name: payload.display_name,
        description: payload.description
      });
      break;
    case CB_EVENT_PERMISSION_RESOLVED:
      commit('removePermission', payload.request_id);
      break;
    case CB_EVENT_SESSION_RESULT:
      commit(
        'appendEvent',
        makeEvent(sessionId, 'result', {
          subtype: payload.subtype,
          is_error: payload.is_error,
          text: payload.result,
          cost_usd: payload.cost_usd
        })
      );
      commit('updateSession', { session_id: sessionId, status: 'idle', cost_usd: payload.cost_usd });
      break;
    case CB_EVENT_SESSION_ERROR:
      commit('appendEvent', makeEvent(sessionId, 'error', { text: payload.message }));
      commit('updateSession', { session_id: sessionId, status: 'error' });
      break;
    case CB_EVENT_SESSION_CLOSED:
      commit('updateSession', { session_id: sessionId, status: 'closed' });
      break;
    case CB_EVENT_SESSIONS_SNAPSHOT:
      for (const item of payload.sessions ?? []) {
        commit('upsertSession', {
          session_id: item.session_id,
          node_id: fromNode,
          status: item.status ?? 'idle',
          cwd: item.cwd,
          model: item.model
        });
      }
      break;
    default:
      break;
  }
};

export const resetAll = ({ commit }: ActionContext<ICodingBridgeState, IRootState>): void => {
  commit('resetAll');
};

// --- Layout no-ops: Coding Bridge is not a billed service. `Main.vue` calls
// `<appName>/getApplications` and `<appName>/setApplication` generically; these
// stubs keep that contract without pulling in any billing concept. ----------
export const getApplications = async (): Promise<void> => {};
export const setApplication = async (): Promise<void> => {};

export const getNodes = async ({
  commit,
  rootState
}: ActionContext<ICodingBridgeState, IRootState>): Promise<ICodingBridgeNode[]> => {
  const token = rootState.token?.access;
  if (!token) {
    return [];
  }
  commit('updateStatus', { key: 'getNodes', value: Status.Request });
  try {
    const { data } = await codingBridgeOperator.getNodes({ token });
    commit('setNodes', data.nodes ?? []);
    commit('updateStatus', { key: 'getNodes', value: Status.Success });
    return data.nodes ?? [];
  } catch (error) {
    commit('updateStatus', { key: 'getNodes', value: Status.Error });
    throw error;
  }
};

export const claimPair = async (
  { commit, dispatch, rootState }: ActionContext<ICodingBridgeState, IRootState>,
  pairCode: string
): Promise<string> => {
  const token = rootState.token?.access;
  if (!token) {
    throw new Error('not authenticated');
  }
  commit('updateStatus', { key: 'claimPair', value: Status.Request });
  try {
    const { data } = await codingBridgeOperator.claimPair(pairCode.trim(), { token });
    commit('updateStatus', { key: 'claimPair', value: Status.Success });
    await dispatch('getNodes');
    return data.node_name;
  } catch (error) {
    commit('updateStatus', { key: 'claimPair', value: Status.Error });
    throw error;
  }
};

export const deleteNode = async (
  { commit, dispatch, state, rootState }: ActionContext<ICodingBridgeState, IRootState>,
  nodeId: string
): Promise<void> => {
  const token = rootState.token?.access;
  if (!token) {
    throw new Error('not authenticated');
  }
  commit('updateStatus', { key: 'deleteNode', value: Status.Request });
  try {
    await codingBridgeOperator.deleteNode(nodeId, { token });
    commit('removeNodeData', nodeId);
    if (state.currentNodeId === nodeId) {
      commit('setCurrentNode', undefined);
      commit('setCurrentSession', undefined);
    }
    commit('updateStatus', { key: 'deleteNode', value: Status.Success });
    await dispatch('getNodes');
  } catch (error) {
    commit('updateStatus', { key: 'deleteNode', value: Status.Error });
    throw error;
  }
};

export const connect = ({ commit, rootState }: ActionContext<ICodingBridgeState, IRootState>): void => {
  const token = rootState.token?.access;
  if (!token) {
    return;
  }
  if (socket?.isOpen) {
    return;
  }
  socket?.close();
  commit('setConnection', 'connecting');
  socket = new CodingBridgeSocket(token, {
    onOpen: () => commit('setConnection', 'connected'),
    onClose: () => commit('setConnection', 'disconnected'),
    onEvent: (payload, fromNode) => applyNodeEvent(commit, payload, fromNode),
    onNodesSnapshot: (nodes) => {
      // Merge live online flags onto the REST-sourced list without dropping
      // offline nodes the snapshot omits.
      commit('mergeNodeSnapshot', nodes);
    },
    onNodeStatus: (nodeId, status) => commit('setNodeStatus', { node_id: nodeId, status }),
    onRelayError: (code, message) => console.warn('[codingBridge] relay error', code, message)
  });
  socket.connect();
};

export const disconnect = ({ commit }: ActionContext<ICodingBridgeState, IRootState>): void => {
  socket?.close();
  socket = undefined;
  commit('setConnection', 'disconnected');
};

export const selectNode = (
  { commit, state }: ActionContext<ICodingBridgeState, IRootState>,
  nodeId: string | undefined
): void => {
  commit('setCurrentNode', nodeId);
  if (!nodeId) {
    commit('setCurrentSession', undefined);
    return;
  }
  const ids = Object.values(state.sessions)
    .filter((session) => session.node_id === nodeId)
    .map((session) => session.session_id);
  commit('setCurrentSession', ids.length ? ids[ids.length - 1] : undefined);
};

export const newSession = ({ commit }: ActionContext<ICodingBridgeState, IRootState>): void => {
  commit('setCurrentSession', undefined);
};

export const sendPrompt = (
  { commit, state }: ActionContext<ICodingBridgeState, IRootState>,
  payload: { prompt: string; cwd?: string; model?: string }
): void => {
  const nodeId = state.currentNodeId;
  const prompt = payload.prompt?.trim();
  if (!nodeId || !prompt || !socket) {
    return;
  }
  let sessionId = state.currentSessionId;
  const isNew = !sessionId || !state.sessions[sessionId];
  if (isNew) {
    sessionId = uid();
    commit('upsertSession', {
      session_id: sessionId,
      node_id: nodeId,
      status: 'starting',
      cwd: payload.cwd,
      model: payload.model
    });
    commit('setCurrentSession', sessionId);
    commit('appendEvent', makeEvent(sessionId, 'prompt', { text: prompt }));
    socket.sendToNode(nodeId, {
      action: CB_ACTION_SESSION_START,
      session_id: sessionId,
      prompt,
      cwd: payload.cwd || undefined,
      model: payload.model || undefined,
      permission_mode: 'default'
    });
  } else {
    commit('appendEvent', makeEvent(sessionId as string, 'prompt', { text: prompt }));
    commit('updateSession', { session_id: sessionId as string, status: 'running' });
    socket.sendToNode(nodeId, {
      action: CB_ACTION_SESSION_SEND,
      session_id: sessionId,
      prompt
    });
  }
};

export const interruptSession = ({ state }: ActionContext<ICodingBridgeState, IRootState>): void => {
  const sessionId = state.currentSessionId;
  const nodeId = state.currentNodeId;
  if (!sessionId || !nodeId || !socket) {
    return;
  }
  socket.sendToNode(nodeId, { action: CB_ACTION_SESSION_INTERRUPT, session_id: sessionId });
};

export const closeSession = (
  { commit, state }: ActionContext<ICodingBridgeState, IRootState>,
  sessionId?: string
): void => {
  const sid = sessionId ?? state.currentSessionId;
  if (!sid) {
    return;
  }
  const nodeId = state.sessions[sid]?.node_id ?? state.currentNodeId;
  if (nodeId && socket) {
    socket.sendToNode(nodeId, { action: CB_ACTION_SESSION_CLOSE, session_id: sid });
  }
  commit('updateSession', { session_id: sid, status: 'closed' });
  if (state.currentSessionId === sid) {
    commit('setCurrentSession', undefined);
  }
};

export const resolvePermission = (
  { commit, state }: ActionContext<ICodingBridgeState, IRootState>,
  payload: { request_id: string; decision: 'allow' | 'deny' }
): void => {
  const request = state.permissions.find((item) => item.request_id === payload.request_id);
  if (!request) {
    return;
  }
  socket?.sendToNode(request.node_id, {
    action: CB_ACTION_PERMISSION_RESOLVE,
    request_id: payload.request_id,
    decision: payload.decision
  });
  commit('removePermission', payload.request_id);
};

export default {
  resetAll,
  getApplications,
  setApplication,
  getNodes,
  claimPair,
  deleteNode,
  connect,
  disconnect,
  selectNode,
  newSession,
  sendPrompt,
  interruptSession,
  closeSession,
  resolvePermission
};
