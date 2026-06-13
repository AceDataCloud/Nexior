import initialState from './state';
import { ICodingBridgeHistoryRef, ICodingBridgeState } from './models';
import {
  ICodingBridgeCapabilities,
  ICodingBridgeComposerPrefs,
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

// Drop the event with `event_id` and everything after it. Used when editing a
// past prompt: the transcript is rewound to before that prompt so the UI
// mirrors the conversation fork the node performs.
export const truncateEventsBefore = (
  state: ICodingBridgeState,
  payload: { session_id: string; event_id: string }
): void => {
  const events = state.events[payload.session_id];
  if (!events) {
    return;
  }
  const index = events.findIndex((event) => event.id === payload.event_id);
  if (index >= 0) {
    state.events[payload.session_id] = events.slice(0, index);
  }
};

// Apply a node-authoritative rewind (the `session.rewound` event): keep the
// transcript up to and including the result whose `cut_uuid` matches, dropping
// the abandoned turns after it. `cut_uuid` empty → editing the first prompt, so
// the whole transcript is cleared. This is what makes a reconnect-after-edit
// rebuild the correct branch from the log instead of replaying the old turns.
export const rewindToCut = (state: ICodingBridgeState, payload: { session_id: string; cut_uuid?: string }): void => {
  const events = state.events[payload.session_id];
  if (!events) {
    return;
  }
  if (!payload.cut_uuid) {
    state.events[payload.session_id] = [];
    return;
  }
  const index = events.findIndex((event) => event.kind === 'result' && event.cut_uuid === payload.cut_uuid);
  if (index >= 0) {
    state.events[payload.session_id] = events.slice(0, index + 1);
  }
};

// Remember the highest event seq applied for a session (reconnect cursor).
export const setLastSeq = (state: ICodingBridgeState, payload: { session_id: string; seq: number }): void => {
  const current = state.lastSeq[payload.session_id] ?? 0;
  if (payload.seq > current) {
    state.lastSeq[payload.session_id] = payload.seq;
  }
};

// Streaming: append an incremental text chunk onto the open bubble matching
// `stream_id`. No-op if the bubble was already finalized or never created.
export const appendDelta = (
  state: ICodingBridgeState,
  payload: { session_id: string; stream_id: string; text: string }
): void => {
  const events = state.events[payload.session_id];
  if (!events) {
    return;
  }
  const target = events.find((item) => item.kind === 'text' && item.stream_id === payload.stream_id);
  if (target) {
    target.text = (target.text ?? '') + (payload.text ?? '');
  }
};

// Streaming: close the bubble matching `stream_id`, optionally replacing its
// text with the authoritative final value from the node.
export const finalizeStream = (
  state: ICodingBridgeState,
  payload: { session_id: string; stream_id: string; text?: string }
): void => {
  const events = state.events[payload.session_id];
  if (!events) {
    return;
  }
  const target = events.find((item) => item.kind === 'text' && item.stream_id === payload.stream_id);
  if (target) {
    if (typeof payload.text === 'string') {
      target.text = payload.text;
    }
    target.streaming = false;
  }
};

// Streaming: close every still-open bubble in a session (turn ended / errored).
export const finalizeAllStreams = (state: ICodingBridgeState, payload: { session_id: string }): void => {
  const events = state.events[payload.session_id];
  if (!events) {
    return;
  }
  for (const item of events) {
    if (item.streaming) {
      item.streaming = false;
    }
  }
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

export const setLastComposer = (
  state: ICodingBridgeState,
  payload: { node_id: string; prefs: ICodingBridgeComposerPrefs }
): void => {
  state.lastComposer = {
    ...state.lastComposer,
    [payload.node_id]: { ...state.lastComposer[payload.node_id], ...payload.prefs }
  };
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
      delete state.lastSeq[session.session_id];
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
  truncateEventsBefore,
  rewindToCut,
  setLastSeq,
  appendDelta,
  finalizeStream,
  finalizeAllStreams,
  setEvents,
  setHistory,
  setHistoryRef,
  setDirectory,
  setDirectoryLoading,
  setLastComposer,
  setCapabilities,
  addPermission,
  removePermission,
  removeNodeData
};
