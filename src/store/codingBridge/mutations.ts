import initialState from './state';
import { ICodingBridgeHistoryRef, ICodingBridgeState } from './models';
import {
  ICodingBridgeCapabilities,
  ICodingBridgeConnectionStatus,
  ICodingBridgeDirListing,
  ICodingBridgeEvent,
  ICodingBridgeHistorySummary,
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

// Replace a session's transcript wholesale (used when replaying history).
export const setEvents = (
  state: ICodingBridgeState,
  payload: { session_id: string; events: ICodingBridgeEvent[] }
): void => {
  state.events[payload.session_id] = payload.events;
};

export const setHistory = (
  state: ICodingBridgeState,
  payload: { node_id: string; sessions: ICodingBridgeHistorySummary[] }
): void => {
  state.history[payload.node_id] = payload.sessions;
};

export const setHistoryRef = (state: ICodingBridgeState, payload: ICodingBridgeHistoryRef | undefined): void => {
  state.historyRef = payload;
};

export const setDirectory = (state: ICodingBridgeState, payload: ICodingBridgeDirListing | undefined): void => {
  state.directory = payload;
  state.directoryLoading = false;
};

export const setDirectoryLoading = (state: ICodingBridgeState, payload: boolean): void => {
  state.directoryLoading = payload;
};

export const setCapabilities = (
  state: ICodingBridgeState,
  payload: { node_id: string; capabilities: ICodingBridgeCapabilities }
): void => {
  state.capabilities[payload.node_id] = payload.capabilities;
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
  delete state.history[nodeId];
  delete state.capabilities[nodeId];
  if (state.historyRef?.node_id === nodeId) {
    state.historyRef = undefined;
  }
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
  setEvents,
  setHistory,
  setHistoryRef,
  setDirectory,
  setDirectoryLoading,
  setCapabilities,
  addPermission,
  removePermission,
  removeNodeData
};
