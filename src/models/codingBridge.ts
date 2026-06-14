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

/** One selectable model offered by a provider, as reported by the node. */
export interface ICodingBridgeModelOption {
  value: string;
  label: string;
}

/**
 * Last composer setup used on a node, so a new session pre-fills it instead of
 * resetting to defaults every time. Node-scoped because cwd / provider / model
 * are all device-specific. Persisted to localStorage.
 */
export interface ICodingBridgeComposerPrefs {
  cwd?: string;
  provider?: string;
  model?: string;
  permissionMode?: string;
  effort?: string;
}

/**
 * What one backend on a node can do, reported by the node's `capabilities.get`.
 * The UI renders dropdowns from this instead of hard-coding models / efforts,
 * so a new model only needs a node update (or a typed-in custom value).
 */
export interface ICodingBridgeProviderCapability {
  name: string;
  label: string;
  available: boolean;
  models: ICodingBridgeModelOption[];
  // Effort tokens ('' = backend default); the UI localizes known ones.
  efforts: string[];
  permission_modes: string[];
  allow_custom_model: boolean;
  // Whether a past prompt can be edited (the conversation forked at that turn).
  // Claude supports it; Codex does not. Absent on older nodes → treat as false.
  supports_edit?: boolean;
  // Whether editing can also roll back on-disk file changes, so the UI can
  // offer a "restore code" choice. Absent on older nodes → treat as false.
  supports_code_restore?: boolean;
  // Slash commands this backend can actually run in a remote session, used to
  // drive the composer autocomplete. Absent on older nodes.
  commands?: ICodingBridgeSlashCommand[];
}

/** One slash command a backend advertises as runnable in a remote session. */
export interface ICodingBridgeSlashCommand {
  name: string;
  description?: string;
  argument_hint?: string;
  aliases?: string[];
}

/** The full capabilities descriptor a node advertises. */
export interface ICodingBridgeCapabilities {
  providers: ICodingBridgeProviderCapability[];
}

/** A live agent session running inside one node. */
export interface ICodingBridgeSession {
  session_id: string;
  node_id: string;
  status: ICodingBridgeSessionStatus;
  cwd?: string;
  model?: string;
  // Reasoning-effort tier and permission/edit mode the session is running with.
  // Transcripts don't record these, so a history replay seeds them from the
  // node's last composer prefs; a sent turn keeps them current. Both stay
  // editable per query (the node applies them on each turn).
  effort?: string;
  permission_mode?: string;
  cost_usd?: number;
  // Which backend this session targets; defaults to Claude Code.
  provider?: ICodingBridgeHistoryProvider;
  // Provider session id to resume when the first prompt is sent (Claude only).
  resume_session_id?: string;
  // The SDK/CLI's own session id for a live session, reported by the node on
  // each turn's result. The fork target when editing a past prompt.
  sdk_session_id?: string;
  // A live turn has been started on the node for this session.
  started?: boolean;
  // Replay of past history that cannot be continued (e.g. Codex).
  readonly?: boolean;
  // Trace id of the most recent turn, threaded browser → relay → node and back
  // for end-to-end correlation in logs.
  trace_id?: string;
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
export type ICodingBridgeEventKind =
  | 'prompt'
  | 'text'
  | 'thinking'
  | 'tool_use'
  | 'tool_result'
  | 'result'
  | 'notice'
  | 'error';

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
  // Result events only: the fork point for editing the NEXT prompt — the uuid
  // of the last kept transcript message — and the session to resume from.
  cut_uuid?: string;
  sdk_session_id?: string;
  // Notice events: a machine code (e.g. 'slash_unavailable') and the command
  // the user typed, so the UI can render a localized message.
  command?: string;
  level?: string;
  // Streaming assistant text: `stream_id` ties text_delta chunks to their
  // final `session.text` commit; `streaming` stays true while deltas arrive.
  stream_id?: string;
  streaming?: boolean;
  // Legacy data-URL previews of images the user attached to a prompt turn.
  images?: string[];
  attachments?: ICodingBridgeAttachment[];
  // Trace id correlating this event with the turn that produced it.
  trace_id?: string;
}

/** One browser-uploaded file/image attached to a prompt turn. */
export interface ICodingBridgeAttachment {
  type: 'image' | 'file';
  url: string;
  name?: string;
  mime_type?: string;
  size?: number;
}

/** One entry returned by a node's `fs.list` directory listing. */
export interface ICodingBridgeDirEntry {
  name: string;
  path: string;
  type: 'dir' | 'file';
}

/** A directory snapshot from a node, used by the working-directory picker. */
export interface ICodingBridgeDirListing {
  path: string;
  parent: string | null;
  sep: string;
  entries: ICodingBridgeDirEntry[];
  truncated?: boolean;
  error?: string;
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

/** Push capability advertised by the relay (`GET /api/push/config`). */
export interface ICodingBridgePushConfig {
  enabled: boolean;
  web_push_enabled: boolean;
  fcm_enabled: boolean;
  vapid_public_key: string;
}
