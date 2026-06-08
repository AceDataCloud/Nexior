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
export const CB_NODE_TO_BROWSER = 'node.to_browser';
export const CB_NODES_SNAPSHOT = 'nodes.snapshot';
export const CB_NODE_STATUS = 'node.status';
export const CB_ERROR = 'error';

// --- Inner actions: browser -> node ----------------------------------------
export const CB_ACTION_SESSION_START = 'session.start';
export const CB_ACTION_SESSION_SEND = 'session.send';
export const CB_ACTION_SESSION_INTERRUPT = 'session.interrupt';
export const CB_ACTION_SESSION_CLOSE = 'session.close';
export const CB_ACTION_PERMISSION_RESOLVE = 'permission.resolve';
export const CB_ACTION_SESSIONS_LIST = 'sessions.list';
export const CB_ACTION_HISTORY_LIST = 'history.list';
export const CB_ACTION_HISTORY_GET = 'history.get';
export const CB_ACTION_FS_LIST = 'fs.list';
export const CB_ACTION_CAPABILITIES_GET = 'capabilities.get';
export const CB_ACTION_PING = 'ping';

// --- Inner events: node -> browser -----------------------------------------
export const CB_EVENT_SESSION_STARTED = 'session.started';
export const CB_EVENT_SESSION_TEXT = 'session.text';
export const CB_EVENT_SESSION_THINKING = 'session.thinking';
export const CB_EVENT_SESSION_TOOL_USE = 'session.tool_use';
export const CB_EVENT_SESSION_TOOL_RESULT = 'session.tool_result';
export const CB_EVENT_PERMISSION_REQUEST = 'permission.request';
export const CB_EVENT_PERMISSION_RESOLVED = 'permission.resolved';
export const CB_EVENT_SESSION_RESULT = 'session.result';
export const CB_EVENT_SESSION_ERROR = 'session.error';
export const CB_EVENT_SESSION_CLOSED = 'session.closed';
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
