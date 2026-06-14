/**
 * Wire protocol shared with the `coding-bridge` relay and the node daemon.
 *
 * The OUTER envelope `type` is interpreted by the relay; the INNER payload
 * (carrying `action` / `event`) is opaque to the relay and understood only by
 * the browser and the node. These string values must stay in lock-step with
 * `coding-bridge/worker/app/protocol.py` and the node daemon's `protocol.py`.
 */

// --- Outer envelope types (relay) ------------------------------------------
export const CB_BROWSER_TO_NODE = 'browser.to_node';
export const CB_BROWSER_LIST_NODES = 'browser.list_nodes';
// Reconnect: ask the relay to replay each session's events past a cursor.
export const CB_BROWSER_RESUME = 'browser.resume';
export const CB_NODE_TO_BROWSER = 'node.to_browser';
export const CB_NODES_SNAPSHOT = 'nodes.snapshot';
export const CB_NODE_STATUS = 'node.status';
export const CB_ERROR = 'error';

// --- Inner actions: browser -> node ----------------------------------------
export const CB_ACTION_SESSION_START = 'session.start';
export const CB_ACTION_SESSION_SEND = 'session.send';
// Edit a past prompt: fork the conversation at `cut_uuid` and re-run it.
export const CB_ACTION_SESSION_EDIT = 'session.edit';
export const CB_ACTION_SESSION_INTERRUPT = 'session.interrupt';
export const CB_ACTION_SESSION_CLOSE = 'session.close';
export const CB_ACTION_PERMISSION_RESOLVE = 'permission.resolve';
// Reconnect / followed a notification: re-fetch every pending permission prompt.
export const CB_ACTION_PERMISSIONS_LIST = 'permissions.list';
export const CB_ACTION_SESSIONS_LIST = 'sessions.list';
export const CB_ACTION_HISTORY_LIST = 'history.list';
export const CB_ACTION_HISTORY_GET = 'history.get';
export const CB_ACTION_FS_LIST = 'fs.list';
export const CB_ACTION_CAPABILITIES_GET = 'capabilities.get';
export const CB_ACTION_PING = 'ping';

// --- Inner events: node -> browser -----------------------------------------
export const CB_EVENT_SESSION_STARTED = 'session.started';
// The provider's real (SDK) session id is known: re-key the session from the
// provisional id (`session_id`) to the canonical one (`sdk_session_id`).
export const CB_EVENT_SESSION_IDENTIFIED = 'session.identified';
export const CB_EVENT_SESSION_TEXT = 'session.text';
export const CB_EVENT_SESSION_TEXT_DELTA = 'session.text_delta';
export const CB_EVENT_SESSION_THINKING = 'session.thinking';
export const CB_EVENT_SESSION_TOOL_USE = 'session.tool_use';
export const CB_EVENT_SESSION_TOOL_RESULT = 'session.tool_result';
export const CB_EVENT_PERMISSION_REQUEST = 'permission.request';
export const CB_EVENT_PERMISSION_RESOLVED = 'permission.resolved';
// Reply to permissions.list: every still-pending request across all sessions.
export const CB_EVENT_PERMISSIONS_SNAPSHOT = 'permissions.snapshot';
export const CB_EVENT_SESSION_RESULT = 'session.result';
export const CB_EVENT_SESSION_NOTICE = 'session.notice';
export const CB_EVENT_SESSION_ERROR = 'session.error';
export const CB_EVENT_SESSION_CLOSED = 'session.closed';
// A past prompt was edited: the conversation forked at `cut_uuid`. The browser
// folds this into a transcript truncation (rewind), live and on replay.
export const CB_EVENT_SESSION_REWOUND = 'session.rewound';
// The live stream lost events that could not be replayed (cursor too old /
// outbox overflow); resync the session from history.
export const CB_EVENT_SESSION_STREAM_TRUNCATED = 'session.stream_truncated';
export const CB_EVENT_SESSIONS_SNAPSHOT = 'sessions.snapshot';
export const CB_EVENT_HISTORY_SNAPSHOT = 'history.snapshot';
export const CB_EVENT_HISTORY_DETAIL = 'history.detail';
export const CB_EVENT_FS_LIST = 'fs.list';
export const CB_EVENT_CAPABILITIES = 'capabilities';
export const CB_EVENT_PONG = 'pong';

// Reconnect backoff for the browser WebSocket (milliseconds).
export const CB_RECONNECT_MIN_MS = 1000;
export const CB_RECONNECT_MAX_MS = 15000;

// Sidebar navigation logo for the Coding Bridge feature.
export const CODING_BRIDGE_LOGO = 'https://cdn.acedata.cloud/0b28123f35.png';
