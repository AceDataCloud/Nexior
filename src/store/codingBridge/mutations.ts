import {
  appendCodingAgentDelta,
  appendCodingAgentEvent,
  finalizeAllCodingAgentStreams,
  finalizeCodingAgentStream,
  renameCodingAgentSession,
  rewindCodingAgentEvents,
  upsertCodingAgentSession
} from '@acedatacloud/core/coding-agent';
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
  const names = new Map(snapshot.map((node) => [node.node_id, node.name]));
  for (const node of state.nodes) {
    node.status = online.has(node.node_id) ? 'online' : 'offline';
    // The relay is the source of truth for the name. Adopting it here is what
    // makes a rename land on a client that was disconnected when the
    // `node.renamed` broadcast went out (backgrounded phone, closed laptop).
    const name = names.get(node.node_id);
    if (name) {
      node.name = name;
    }
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

export const setNodeName = (state: ICodingBridgeState, payload: { node_id: string; name: string }): void => {
  const node = state.nodes.find((item) => item.node_id === payload.node_id);
  if (node) {
    node.name = payload.name;
  }
};

export const setCurrentNode = (state: ICodingBridgeState, payload: string | undefined): void => {
  state.currentNodeId = payload;
};

export const setCurrentSession = (state: ICodingBridgeState, payload: string | undefined): void => {
  state.currentSessionId = payload;
};

export const upsertSession = (state: ICodingBridgeState, payload: ICodingBridgeSession): void => {
  upsertCodingAgentSession(state, payload);
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

// Re-key a session from its provisional id to the provider's real (SDK) id once
// the node reports it (`session.identified`). Migrates everything indexed by
// session id so the live session and its history entry share one identity. The
// live session's fields win when merging into a pre-existing entry under `to`
// (e.g. a snapshot stub); its transcript is only carried over when non-empty so
// a reattach never blows away events already loaded under the real id.
export const renameSession = (state: ICodingBridgeState, payload: { from: string; to: string }): void => {
  renameCodingAgentSession(state, payload.from, payload.to);
  if (state.historyRef?.session_id === payload.from) {
    state.historyRef = { ...state.historyRef, session_id: payload.to };
  }
};

export const appendEvent = (state: ICodingBridgeState, payload: ICodingBridgeEvent): void => {
  appendCodingAgentEvent(state, payload);
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
  rewindCodingAgentEvents(state, payload.session_id, payload.cut_uuid);
};

// Remember the highest event seq applied for a session (reconnect cursor).
export const setLastSeq = (state: ICodingBridgeState, payload: { session_id: string; seq: number }): void => {
  const current = state.lastSeq[payload.session_id] ?? 0;
  if (payload.seq > current) {
    state.lastSeq[payload.session_id] = payload.seq;
  }
};

// Drop a session's cursor. Used when the relay's seq space restarts under us
// (see `applyNodeEvent`), where keeping the old high-water mark would make every
// live event look like one we had already applied.
export const resetLastSeq = (state: ICodingBridgeState, sessionId: string): void => {
  delete state.lastSeq[sessionId];
};

// Mark a session's seq space as validated on this connection.
export const markSeqChecked = (state: ICodingBridgeState, sessionId: string): void => {
  state.seqChecked[sessionId] = true;
};

// Forget ONE session's validation. Used where that session's seq space is known
// to restart under us (session.closed) but the socket — and every other
// session's cursor on it — stays valid.
export const clearSeqCheckedFor = (state: ICodingBridgeState, sessionId: string): void => {
  delete state.seqChecked[sessionId];
};

// Forget every validation. Called on each (re)connect: the relay is
// single-replica, so a restart always drops our socket — the first event of a
// session after one is where a renumbered seq space can be detected.
export const clearSeqChecked = (state: ICodingBridgeState): void => {
  state.seqChecked = {};
};

// Streaming: append an incremental text chunk onto the open bubble matching
// `stream_id`. No-op if the bubble was already finalized or never created.
export const appendDelta = (
  state: ICodingBridgeState,
  payload: { session_id: string; stream_id: string; text: string }
): void => {
  appendCodingAgentDelta(state, payload.session_id, payload.stream_id, payload.text);
};

// Streaming: close the bubble matching `stream_id`, optionally replacing its
// text with the authoritative final value from the node.
export const finalizeStream = (
  state: ICodingBridgeState,
  payload: { session_id: string; stream_id: string; text?: string }
): void => {
  finalizeCodingAgentStream(state, payload.session_id, payload.stream_id, payload.text);
};

// Streaming: close every still-open bubble in a session (turn ended / errored).
export const finalizeAllStreams = (state: ICodingBridgeState, payload: { session_id: string }): void => {
  finalizeAllCodingAgentStreams(state, payload.session_id);
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
      delete state.seqChecked[session.session_id];
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
  setNodeName,
  setCurrentNode,
  setCurrentSession,
  upsertSession,
  updateSession,
  renameSession,
  appendEvent,
  truncateEventsBefore,
  rewindToCut,
  setLastSeq,
  resetLastSeq,
  markSeqChecked,
  clearSeqChecked,
  clearSeqCheckedFor,
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
