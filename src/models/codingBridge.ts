/**
 * Coding Bridge lets a signed-in user drive a Claude Code / Codex agent that
 * runs on their own machine (a "node" daemon) from the web UI. The browser
 * never executes anything: it only relays JSON envelopes to the node through
 * the stateful `coding-bridge` relay over a single authenticated WebSocket.
 */

/** A node daemon owned by the current user, as returned by `GET /api/nodes`. */
export interface ICodingBridgeNode {
  node_id: string;
  name: string;
  status: 'online' | 'offline';
  capabilities?: string[];
  last_seen?: number;
}

export type ICodingBridgeSessionStatus = 'starting' | 'running' | 'idle' | 'closed' | 'error';

export type ICodingBridgeHistoryProvider = 'claude' | 'codex';

/** A live agent session running inside one node. */
export interface ICodingBridgeSession {
  session_id: string;
  node_id: string;
  status: ICodingBridgeSessionStatus;
  cwd?: string;
  model?: string;
  cost_usd?: number;
  // Which backend this session targets; defaults to Claude Code.
  provider?: ICodingBridgeHistoryProvider;
  // Provider session id to resume when the first prompt is sent (Claude only).
  resume_session_id?: string;
  // A live turn has been started on the node for this session.
  started?: boolean;
  // Replay of past history that cannot be continued (e.g. Codex).
  readonly?: boolean;
}

/** One past on-device session as listed by `history.list`. */
export interface ICodingBridgeHistorySummary {
  provider: ICodingBridgeHistoryProvider;
  session_id: string;
  title: string;
  cwd?: string;
  git_branch?: string;
  updated_at?: number;
  message_count?: number;
}

/** A normalised transcript returned by `history.get`. */
export interface ICodingBridgeHistoryDetail {
  provider: ICodingBridgeHistoryProvider;
  session_id: string;
  title?: string;
  cwd?: string;
  git_branch?: string;
  model?: string;
  events: Array<Partial<ICodingBridgeEvent> & { kind: ICodingBridgeEventKind }>;
}

/**
 * A single rendered item in a session transcript. We flatten every node event
 * (and the locally-echoed user prompt) into this one shape so the transcript
 * view can render a uniform, append-only list.
 */
export type ICodingBridgeEventKind = 'prompt' | 'text' | 'thinking' | 'tool_use' | 'tool_result' | 'result' | 'error';

export interface ICodingBridgeEvent {
  id: string;
  session_id: string;
  kind: ICodingBridgeEventKind;
  ts: number;
  text?: string;
  tool?: string;
  tool_use_id?: string;
  input?: Record<string, any>;
  content?: string;
  is_error?: boolean;
  subtype?: string;
  cost_usd?: number;
}

/** A pending tool-permission request awaiting the user's approval. */
export interface ICodingBridgePermissionRequest {
  request_id: string;
  session_id: string;
  node_id: string;
  tool: string;
  title?: string;
  display_name?: string;
  description?: string;
  input?: Record<string, any>;
}

export type ICodingBridgeConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Response of `POST /pair/claim`. */
export interface ICodingBridgeClaimResponse {
  ok: boolean;
  node_name: string;
}
