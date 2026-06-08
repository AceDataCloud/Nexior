import initialState from './state';
import { ICodingBridgeState } from './models';
import {
  ICodingBridgeConnectionStatus,
  ICodingBridgeEvent,
  ICodingBridgeNode,
  ICodingBridgePermissionRequest,
  ICodingBridgeSession,
  Status
} from '@/models';

export const resetAll = (state: ICodingBridgeState): void => {
  Object.assign(state, initialState());
};

export const updateStatus = (
  state: ICodingBridgeState,
  payload: { key: keyof ICodingBridgeState['status']; value: Status }
): void => {
  state.status[payload.key] = payload.value;
};

export const setConnection = (state: ICodingBridgeState, payload: ICodingBridgeConnectionStatus): void => {
  state.connection = payload;
};

export const setNodes = (state: ICodingBridgeState, payload: ICodingBridgeNode[]): void => {
  state.nodes = payload;
};

export const mergeNodeSnapshot = (state: ICodingBridgeState, snapshot: ICodingBridgeNode[]): void => {
  const online = new Set(snapshot.map((node) => node.node_id));
  for (const node of state.nodes) {
    node.status = online.has(node.node_id) ? 'online' : 'offline';
  }
  for (const snap of snapshot) {
    if (!state.nodes.some((node) => node.node_id === snap.node_id)) {
      state.nodes.push({ ...snap, status: 'online' });
    }
  }
};

export const setNodeStatus = (
  state: ICodingBridgeState,
  payload: { node_id: string; status: 'online' | 'offline' }
): void => {
  const node = state.nodes.find((item) => item.node_id === payload.node_id);
  if (node) {
    node.status = payload.status;
  }
};

export const setCurrentNode = (state: ICodingBridgeState, payload: string | undefined): void => {
  state.currentNodeId = payload;
};

export const setCurrentSession = (state: ICodingBridgeState, payload: string | undefined): void => {
  state.currentSessionId = payload;
};

export const upsertSession = (state: ICodingBridgeState, payload: ICodingBridgeSession): void => {
  state.sessions[payload.session_id] = { ...state.sessions[payload.session_id], ...payload };
  if (!state.events[payload.session_id]) {
    state.events[payload.session_id] = [];
  }
};

export const updateSession = (
  state: ICodingBridgeState,
  payload: { session_id: string } & Partial<ICodingBridgeSession>
): void => {
  const existing = state.sessions[payload.session_id];
  if (existing) {
    state.sessions[payload.session_id] = { ...existing, ...payload };
  }
};

export const appendEvent = (state: ICodingBridgeState, payload: ICodingBridgeEvent): void => {
  if (!state.events[payload.session_id]) {
    state.events[payload.session_id] = [];
  }
  state.events[payload.session_id].push(payload);
};

export const addPermission = (state: ICodingBridgeState, payload: ICodingBridgePermissionRequest): void => {
  if (state.permissions.some((item) => item.request_id === payload.request_id)) {
    return;
  }
  state.permissions.push(payload);
};

export const removePermission = (state: ICodingBridgeState, requestId: string): void => {
  state.permissions = state.permissions.filter((item) => item.request_id !== requestId);
};

export const removeNodeData = (state: ICodingBridgeState, nodeId: string): void => {
  for (const session of Object.values(state.sessions)) {
    if (session.node_id === nodeId) {
      delete state.sessions[session.session_id];
      delete state.events[session.session_id];
      if (state.currentSessionId === session.session_id) {
        state.currentSessionId = undefined;
      }
    }
  }
};

export default {
  resetAll,
  updateStatus,
  setConnection,
  setNodes,
  mergeNodeSnapshot,
  setNodeStatus,
  setCurrentNode,
  setCurrentSession,
  upsertSession,
  updateSession,
  appendEvent,
  addPermission,
  removePermission,
  removeNodeData
};
