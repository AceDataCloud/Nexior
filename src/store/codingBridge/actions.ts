import { ActionContext } from 'vuex';
import { codingBridgeOperator } from '@/operators';
import { ICodingBridgeHistoryRef, ICodingBridgeState } from './models';
import { IRootState } from '../common/models';
import {
  Status,
  ICodingBridgeAttachment,
  ICodingBridgeEvent,
  ICodingBridgeEventKind,
  ICodingBridgeNode
} from '@/models';
import { CodingBridgeSocket } from '@/utils/codingBridgeSocket';
import {
  CB_ACTION_SESSION_START,
  CB_ACTION_SESSION_SEND,
  CB_ACTION_SESSION_EDIT,
  CB_ACTION_SESSION_INTERRUPT,
  CB_ACTION_SESSION_CLOSE,
  CB_ACTION_PERMISSION_RESOLVE,
  CB_ACTION_HISTORY_LIST,
  CB_ACTION_HISTORY_GET,
  CB_ACTION_FS_LIST,
  CB_ACTION_CAPABILITIES_GET,
  CB_EVENT_SESSION_STARTED,
  CB_EVENT_SESSION_TEXT,
  CB_EVENT_SESSION_TEXT_DELTA,
  CB_EVENT_SESSION_THINKING,
  CB_EVENT_SESSION_TOOL_USE,
  CB_EVENT_SESSION_TOOL_RESULT,
  CB_EVENT_PERMISSION_REQUEST,
  CB_EVENT_PERMISSION_RESOLVED,
  CB_EVENT_SESSION_RESULT,
  CB_EVENT_SESSION_NOTICE,
  CB_EVENT_SESSION_ERROR,
  CB_EVENT_SESSION_CLOSED,
  CB_EVENT_SESSION_REWOUND,
  CB_EVENT_SESSION_STREAM_TRUNCATED,
  CB_EVENT_SESSIONS_SNAPSHOT,
  CB_EVENT_HISTORY_SNAPSHOT,
  CB_EVENT_HISTORY_DETAIL,
  CB_EVENT_FS_LIST,
  CB_EVENT_CAPABILITIES
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

// Parse the AskUserQuestion wizard's JSON output (`{"answers": {...}}`).
const parseAnswers = (output: string): Record<string, unknown> => {
  try {
    const parsed = JSON.parse(output);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // Malformed output: fall back to an empty answer set below.
  }
  return { answers: {} };
};

// Render answers as `question → choice` lines for nodes that surface the
// reply as plain text rather than reading the structured `answer`.
const formatAnswerText = (output: string): string => {
  const answers = (parseAnswers(output).answers ?? {}) as Record<string, string | string[]>;
  return Object.entries(answers)
    .map(([question, value]) => `${question} → ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');
};

// Translate one inner node event into the matching mutation(s).
const applyNodeEvent = (
  commit: ActionContext<ICodingBridgeState, IRootState>['commit'],
  dispatch: ActionContext<ICodingBridgeState, IRootState>['dispatch'],
  state: ICodingBridgeState,
  payload: Record<string, any>,
  fromNode: string | undefined
): void => {
  const event = payload?.event;
  const sessionId = payload?.session_id;
  const traceId = payload?.trace_id;
  // Reliable delivery: durable events carry a monotonic relay-assigned `seq`.
  // Drop any we have already applied (replay/live overlap on reconnect) and
  // advance the cursor used to resume after the next disconnect.
  const seq = payload?.seq;
  if (typeof seq === 'number' && sessionId) {
    const last = state.lastSeq[sessionId];
    if (last !== undefined && seq <= last) {
      return;
    }
    commit('setLastSeq', { session_id: sessionId, seq });
  }
  // Keep the session's trace id current with whatever turn the node is on.
  if (sessionId && traceId) {
    commit('updateSession', { session_id: sessionId, trace_id: traceId });
  }
  switch (event) {
    case CB_EVENT_SESSION_STARTED:
      commit('upsertSession', {
        session_id: sessionId,
        node_id: fromNode,
        status: 'idle',
        cwd: payload.cwd,
        model: payload.model,
        trace_id: traceId
      });
      break;
    case CB_EVENT_SESSION_TEXT_DELTA: {
      // Streaming chunk: grow the open bubble for this stream id, or open a
      // new streaming bubble if this is the first delta seen for it.
      const streamId = payload.id;
      const open =
        streamId && state.events[sessionId]?.find((item) => item.kind === 'text' && item.stream_id === streamId);
      if (open) {
        commit('appendDelta', { session_id: sessionId, stream_id: streamId, text: payload.text ?? '' });
      } else {
        commit(
          'appendEvent',
          makeEvent(sessionId, 'text', {
            text: payload.text ?? '',
            stream_id: streamId,
            streaming: true,
            trace_id: traceId
          })
        );
      }
      break;
    }
    case CB_EVENT_SESSION_TEXT: {
      // Final commit: close the matching streaming bubble with the
      // authoritative text, or render a standalone (non-streamed) message.
      const streamId = payload.id;
      const open =
        streamId && state.events[sessionId]?.find((item) => item.kind === 'text' && item.stream_id === streamId);
      if (open) {
        commit('finalizeStream', { session_id: sessionId, stream_id: streamId, text: payload.text });
      } else {
        commit('appendEvent', makeEvent(sessionId, 'text', { text: payload.text, trace_id: traceId }));
      }
      break;
    }
    case CB_EVENT_SESSION_THINKING:
      commit('appendEvent', makeEvent(sessionId, 'thinking', { text: payload.text, trace_id: traceId }));
      break;
    case CB_EVENT_SESSION_TOOL_USE:
      commit(
        'appendEvent',
        makeEvent(sessionId, 'tool_use', {
          tool: payload.tool,
          tool_use_id: payload.tool_use_id,
          input: payload.input,
          trace_id: traceId
        })
      );
      break;
    case CB_EVENT_SESSION_TOOL_RESULT:
      commit(
        'appendEvent',
        makeEvent(sessionId, 'tool_result', {
          tool_use_id: payload.tool_use_id,
          content: payload.content,
          is_error: payload.is_error,
          trace_id: traceId
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
      // A turn ended: close any still-open streaming bubble before the result.
      commit('finalizeAllStreams', { session_id: sessionId });
      commit(
        'appendEvent',
        makeEvent(sessionId, 'result', {
          subtype: payload.subtype,
          is_error: payload.is_error,
          text: payload.result,
          cost_usd: payload.cost_usd,
          // Fork point for editing the next prompt (Claude reports these).
          cut_uuid: payload.cut_uuid,
          sdk_session_id: payload.sdk_session_id,
          trace_id: traceId
        })
      );
      commit('updateSession', {
        session_id: sessionId,
        status: 'idle',
        cost_usd: payload.cost_usd,
        // Keep the live SDK session id current so an edit can fork from it.
        ...(payload.sdk_session_id ? { sdk_session_id: payload.sdk_session_id } : {})
      });
      break;
    case CB_EVENT_SESSION_NOTICE:
      // A friendly heads-up (e.g. a slash command that can't run remotely).
      // The node already closes the turn with its own session.result.
      commit(
        'appendEvent',
        makeEvent(sessionId, 'notice', {
          text: payload.text,
          subtype: payload.code,
          command: payload.command,
          level: payload.level
        })
      );
      break;
    case CB_EVENT_SESSION_ERROR:
      commit('finalizeAllStreams', { session_id: sessionId });
      commit('appendEvent', makeEvent(sessionId, 'error', { text: payload.message, trace_id: traceId }));
      commit('updateSession', { session_id: sessionId, status: 'error' });
      break;
    case CB_EVENT_SESSION_CLOSED:
      commit('finalizeAllStreams', { session_id: sessionId });
      commit('updateSession', { session_id: sessionId, status: 'closed' });
      break;
    case CB_EVENT_SESSION_REWOUND:
      // A past prompt was edited: fold the fork into the transcript by rewinding
      // to the cut point, then re-echo the edited prompt. Authoritative and
      // deterministic, so a reconnect replay rebuilds the right branch (the live
      // path already did this optimistically in editPrompt; re-applying is a
      // no-op that yields the same state).
      commit('rewindToCut', { session_id: sessionId, cut_uuid: payload.cut_uuid });
      if (payload.prompt) {
        commit('appendEvent', makeEvent(sessionId, 'prompt', { text: payload.prompt, trace_id: traceId }));
      }
      commit('updateSession', { session_id: sessionId, status: 'running' });
      break;
    case CB_EVENT_SESSION_STREAM_TRUNCATED:
      // The live stream lost events neither relay nor node could retain (cursor
      // too old / outbox overflow). Resync the session from the device transcript
      // rather than trust the cursor — never a silent gap.
      dispatch('resyncSession', sessionId);
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
    case CB_EVENT_HISTORY_SNAPSHOT:
      if (fromNode) {
        commit('setHistory', { node_id: fromNode, sessions: payload.sessions ?? [] });
        commit('updateStatus', { key: 'getHistory', value: Status.Success });
        // Restore the conversation that was open before a reload.
        const ref = state.historyRef;
        if (ref && ref.node_id === fromNode && !state.currentSessionId) {
          dispatch('getHistoryDetail', ref);
        }
      }
      break;
    case CB_EVENT_HISTORY_DETAIL:
      applyHistoryDetail(commit, payload, fromNode);
      break;
    case CB_EVENT_FS_LIST:
      // Directory listings are node-scoped (no session_id) and feed the
      // working-directory picker directly.
      commit('setDirectory', {
        path: payload.path,
        parent: payload.parent ?? null,
        sep: payload.sep ?? '/',
        entries: payload.entries ?? [],
        truncated: payload.truncated,
        error: payload.error
      });
      break;
    case CB_EVENT_CAPABILITIES:
      if (fromNode) {
        commit('setCapabilities', {
          node_id: fromNode,
          capabilities: { providers: payload.providers ?? [] }
        });
      }
      break;
    default:
      break;
  }
};

// Materialise a replayed transcript as a (resumable) session.
const applyHistoryDetail = (
  commit: ActionContext<ICodingBridgeState, IRootState>['commit'],
  payload: Record<string, any>,
  fromNode: string | undefined
): void => {
  const sessionId = payload?.session_id;
  const provider = payload?.provider === 'codex' ? 'codex' : 'claude';
  if (!sessionId || !fromNode) {
    return;
  }
  const resumable = provider === 'claude';
  commit('upsertSession', {
    session_id: sessionId,
    node_id: fromNode,
    status: 'idle',
    cwd: payload.cwd,
    model: payload.model,
    provider,
    started: false,
    readonly: !resumable,
    resume_session_id: resumable ? sessionId : undefined
  });
  const events: ICodingBridgeEvent[] = (payload.events ?? []).map((item: any, index: number) => ({
    id: uid(),
    session_id: sessionId,
    kind: item.kind as ICodingBridgeEventKind,
    ts: typeof item.ts === 'number' ? item.ts : Date.now() + index,
    text: item.text,
    tool: item.tool,
    tool_use_id: item.tool_use_id,
    input: item.input,
    content: item.content,
    is_error: item.is_error,
    subtype: item.subtype,
    cost_usd: item.cost_usd
  }));
  commit('setEvents', { session_id: sessionId, events });
  commit('setCurrentNode', fromNode);
  commit('setCurrentSession', sessionId);
  commit('setHistoryRef', { node_id: fromNode, provider, session_id: sessionId });
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

export const connect = ({
  commit,
  dispatch,
  state,
  rootState
}: ActionContext<ICodingBridgeState, IRootState>): void => {
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
    onOpen: () => {
      commit('setConnection', 'connected');
      // Reconnect: resume each session's live stream from the seq we last saw,
      // so in-flight output is replayed instead of lost. Empty after a full page
      // reload (lastSeq is in-memory) — there the history restore below rebuilds
      // the transcript instead.
      const cursors = { ...state.lastSeq };
      if (Object.keys(cursors).length) {
        socket?.resume(cursors);
      }
      if (state.currentNodeId) {
        dispatch('getHistory', state.currentNodeId);
        dispatch('getCapabilities', state.currentNodeId);
      }
    },
    onClose: () => commit('setConnection', 'disconnected'),
    onEvent: (payload, fromNode) => applyNodeEvent(commit, dispatch, state, payload, fromNode),
    onNodesSnapshot: (nodes) => {
      // Merge live online flags onto the REST-sourced list without dropping
      // offline nodes the snapshot omits.
      commit('mergeNodeSnapshot', nodes);
    },
    onNodeStatus: (nodeId, status) => {
      commit('setNodeStatus', { node_id: nodeId, status });
      if (status === 'online' && nodeId === state.currentNodeId) {
        dispatch('getHistory', nodeId);
        dispatch('getCapabilities', nodeId);
      }
    },
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
  { commit, dispatch, state }: ActionContext<ICodingBridgeState, IRootState>,
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
  dispatch('getHistory', nodeId);
  dispatch('getCapabilities', nodeId);
};

export const newSession = ({ commit }: ActionContext<ICodingBridgeState, IRootState>): void => {
  commit('setCurrentSession', undefined);
  commit('setHistoryRef', undefined);
};

export const sendPrompt = (
  { commit, state }: ActionContext<ICodingBridgeState, IRootState>,
  payload: {
    prompt: string;
    cwd?: string;
    model?: string;
    permissionMode?: string;
    provider?: string;
    effort?: string;
    images?: string[];
    attachments?: ICodingBridgeAttachment[];
  }
): void => {
  const nodeId = state.currentNodeId;
  const prompt = payload.prompt?.trim();
  const images = payload.images?.length ? payload.images : undefined;
  const attachments = payload.attachments?.length ? payload.attachments : undefined;
  if (!nodeId || !socket || (!prompt && !images && !attachments)) {
    return;
  }
  // One trace id per turn, threaded browser → relay → node and echoed back on
  // every resulting event so a single id correlates the whole round-trip.
  const traceId = uid();
  let sessionId = state.currentSessionId;
  const existing = sessionId ? state.sessions[sessionId] : undefined;
  // A turn must be started when there is no session yet, or when the current
  // session is a replayed history conversation that has not been resumed.
  const needsStart = !existing || !existing.started;
  if (needsStart) {
    // Resuming a past conversation keeps its original backend; a brand-new
    // session uses the one picked in the composer (defaulting to Claude).
    const provider = existing?.provider || payload.provider || 'claude';
    if (!existing) {
      sessionId = uid();
      commit('upsertSession', {
        session_id: sessionId,
        node_id: nodeId,
        status: 'starting',
        cwd: payload.cwd,
        model: payload.model,
        provider,
        trace_id: traceId
      });
      commit('setCurrentSession', sessionId);
    } else {
      sessionId = existing.session_id;
      commit('updateSession', { session_id: sessionId, status: 'starting', trace_id: traceId });
    }
    commit(
      'appendEvent',
      makeEvent(sessionId as string, 'prompt', { text: prompt, images, attachments, trace_id: traceId })
    );
    commit('updateSession', { session_id: sessionId as string, started: true });
    socket.sendToNode(nodeId, {
      action: CB_ACTION_SESSION_START,
      session_id: sessionId,
      trace_id: traceId,
      prompt,
      cwd: payload.cwd || existing?.cwd || undefined,
      model: payload.model || existing?.model || undefined,
      permission_mode: payload.permissionMode || 'default',
      provider,
      effort: payload.effort || undefined,
      images,
      attachments,
      resume_session_id: existing?.resume_session_id || undefined
    });
  } else {
    commit('updateSession', { session_id: sessionId as string, trace_id: traceId });
    commit(
      'appendEvent',
      makeEvent(sessionId as string, 'prompt', { text: prompt, images, attachments, trace_id: traceId })
    );
    commit('updateSession', {
      session_id: sessionId as string,
      status: 'running',
      // Keep the stored model in sync with a mid-session switch.
      model: payload.model || undefined
    });
    socket.sendToNode(nodeId, {
      action: CB_ACTION_SESSION_SEND,
      session_id: sessionId,
      trace_id: traceId,
      prompt,
      // Allow switching the model mid-session; sent verbatim so an empty value
      // resets the node to its default model.
      model: payload.model ?? '',
      images,
      attachments
    });
  }
};

// Edit a past prompt: fork the conversation at that turn instead of appending.
// The visible transcript is rewound to before the edited prompt and the node is
// asked to truncate the agent's context to the same point, so the original
// (wrong) prompt and everything after it leave the model's context entirely.
export const editPrompt = (
  { commit, state }: ActionContext<ICodingBridgeState, IRootState>,
  payload: {
    eventId: string;
    prompt: string;
    model?: string;
    permissionMode?: string;
    effort?: string;
    images?: string[];
    attachments?: ICodingBridgeAttachment[];
    restoreCode?: boolean;
  }
): void => {
  const nodeId = state.currentNodeId;
  const sessionId = state.currentSessionId;
  const prompt = payload.prompt?.trim();
  if (!nodeId || !sessionId || !socket || !prompt) {
    return;
  }
  const session = state.sessions[sessionId];
  const events = state.events[sessionId] ?? [];
  const index = events.findIndex((event) => event.id === payload.eventId);
  if (!session || index < 0) {
    return;
  }
  // Fork point: the cut_uuid of the last result before the edited prompt (the
  // end of the previous turn). None → editing the first prompt, so the node
  // starts a fresh session rather than forking.
  let cutUuid: string | undefined;
  for (let i = index - 1; i >= 0; i--) {
    if (events[i].kind === 'result' && events[i].cut_uuid) {
      cutUuid = events[i].cut_uuid;
      break;
    }
  }
  const images = payload.images?.length ? payload.images : undefined;
  const attachments = payload.attachments?.length ? payload.attachments : undefined;
  const traceId = uid();
  // Rewind the visible transcript, then echo the edited prompt as the new turn.
  commit('truncateEventsBefore', { session_id: sessionId, event_id: payload.eventId });
  commit('updateSession', {
    session_id: sessionId,
    status: 'running',
    trace_id: traceId,
    model: payload.model || session.model || undefined
  });
  commit('appendEvent', makeEvent(sessionId, 'prompt', { text: prompt, images, attachments, trace_id: traceId }));
  socket.sendToNode(nodeId, {
    action: CB_ACTION_SESSION_EDIT,
    session_id: sessionId,
    trace_id: traceId,
    cut_uuid: cutUuid,
    prompt,
    // Sent verbatim so an empty value keeps the node's default model.
    model: payload.model || session.model || undefined,
    permission_mode: payload.permissionMode || undefined,
    effort: payload.effort || undefined,
    images,
    attachments,
    restore_code: !!payload.restoreCode
  });
};

// Re-run the most recent user prompt after a turn failed. We force a fresh
// start (clear `started`) so the node re-spawns the agent — the common failure
// is the agent process crashing before the session is really alive on the node.
export const retryLastPrompt = ({ commit, dispatch, state }: ActionContext<ICodingBridgeState, IRootState>): void => {
  const sessionId = state.currentSessionId;
  if (!sessionId) {
    return;
  }
  const session = state.sessions[sessionId];
  const lastPrompt = [...(state.events[sessionId] ?? [])].reverse().find((event) => event.kind === 'prompt');
  if (!session || !lastPrompt) {
    return;
  }
  commit('updateSession', { session_id: sessionId, started: false });
  dispatch('sendPrompt', {
    prompt: lastPrompt.text ?? '',
    cwd: session.cwd,
    model: session.model,
    provider: session.provider,
    images: lastPrompt.images,
    attachments: lastPrompt.attachments
  });
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

// Resolve an `AskUserQuestion` permission with the user's actual selection
// rather than a bare allow/deny. The node maps `decision: 'allow'` onto the
// agent's permission callback and feeds the answer back as the tool result, so
// the turn continues with the user's choice. `answer` is the structured
// `{ answers: { <question>: <label | label[]> } }` produced by the wizard;
// `answer_text` is a readable rendering for nodes that prefer plain text.
export const answerQuestion = (
  { commit, state }: ActionContext<ICodingBridgeState, IRootState>,
  payload: { request_id: string; output: string }
): void => {
  const request = state.permissions.find((item) => item.request_id === payload.request_id);
  if (!request) {
    return;
  }
  socket?.sendToNode(request.node_id, {
    action: CB_ACTION_PERMISSION_RESOLVE,
    request_id: payload.request_id,
    decision: 'allow',
    answer: parseAnswers(payload.output),
    answer_text: formatAnswerText(payload.output)
  });
  commit('removePermission', payload.request_id);
};

// Ask a node to list its local Claude Code / Codex transcripts.
export const getHistory = ({ commit, state }: ActionContext<ICodingBridgeState, IRootState>, nodeId?: string): void => {
  const target = nodeId ?? state.currentNodeId;
  if (!target || !socket) {
    return;
  }
  commit('updateStatus', { key: 'getHistory', value: Status.Request });
  socket.sendToNode(target, { action: CB_ACTION_HISTORY_LIST, limit: 200 });
};

// Ask a node to replay one past transcript so it can be viewed / resumed.
export const getHistoryDetail = (
  _context: ActionContext<ICodingBridgeState, IRootState>,
  payload: ICodingBridgeHistoryRef
): void => {
  if (!payload?.node_id || !payload?.session_id || !socket) {
    return;
  }
  socket.sendToNode(payload.node_id, {
    action: CB_ACTION_HISTORY_GET,
    provider: payload.provider,
    session_id: payload.session_id
  });
};

// Resync a live session from the device transcript after the live stream lost
// events it could not replay (stream_truncated). Pulls the full history detail,
// which replaces the session's events; later live events (higher seq) still
// apply, so the stream picks back up cleanly.
export const resyncSession = (
  { state, dispatch }: ActionContext<ICodingBridgeState, IRootState>,
  sessionId: string
): void => {
  const session = state.sessions[sessionId];
  if (!session?.node_id) {
    return;
  }
  dispatch('getHistoryDetail', {
    node_id: session.node_id,
    session_id: sessionId,
    provider: session.provider ?? 'claude'
  });
};

// Ask the current node to list a directory for the working-directory picker.
export const browseDir = ({ commit, state }: ActionContext<ICodingBridgeState, IRootState>, path?: string): void => {
  const nodeId = state.currentNodeId;
  if (!nodeId || !socket) {
    return;
  }
  commit('setDirectoryLoading', true);
  socket.sendToNode(nodeId, { action: CB_ACTION_FS_LIST, path: path || undefined });
};

export const clearDirectory = ({ commit }: ActionContext<ICodingBridgeState, IRootState>): void => {
  commit('setDirectory', undefined);
};

// Ask a node what providers / models / efforts it offers so the UI can render
// the composer dropdowns without hard-coding any of them.
export const getCapabilities = ({ state }: ActionContext<ICodingBridgeState, IRootState>, nodeId?: string): void => {
  const target = nodeId ?? state.currentNodeId;
  if (!target || !socket) {
    return;
  }
  socket.sendToNode(target, { action: CB_ACTION_CAPABILITIES_GET });
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
  editPrompt,
  retryLastPrompt,
  interruptSession,
  closeSession,
  resolvePermission,
  answerQuestion,
  getHistory,
  getHistoryDetail,
  resyncSession,
  browseDir,
  clearDirectory,
  getCapabilities
};
