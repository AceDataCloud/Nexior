import { CODING_AGENT_ACTION, CODING_AGENT_EVENT, CODING_AGENT_HISTORY_LIMIT } from '@acedatacloud/core/coding-agent';

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
// Another client of the same user renamed a node; apply it live.
export const CB_NODE_RENAMED = 'node.renamed';
// Kept in step with the relay's CODING_BRIDGE_NODE_NAME_MAX_LENGTH, so an
// over-long name is rejected in the dialog instead of by a 400.
export const CB_NODE_NAME_MAX_LENGTH = 64;

export const CB_ERROR = 'error';

// --- Inner actions: browser -> node ----------------------------------------
export const CB_ACTION_SESSION_START = CODING_AGENT_ACTION.sessionStart;
export const CB_ACTION_SESSION_SEND = CODING_AGENT_ACTION.sessionSend;
export const CB_ACTION_SESSION_EDIT = CODING_AGENT_ACTION.sessionEdit;
export const CB_ACTION_SESSION_INTERRUPT = CODING_AGENT_ACTION.sessionInterrupt;
export const CB_ACTION_SESSION_CLOSE = CODING_AGENT_ACTION.sessionClose;
export const CB_ACTION_PERMISSION_RESOLVE = CODING_AGENT_ACTION.permissionResolve;
export const CB_ACTION_PERMISSIONS_LIST = CODING_AGENT_ACTION.permissionsList;
export const CB_ACTION_SESSIONS_LIST = CODING_AGENT_ACTION.sessionsList;
export const CB_ACTION_HISTORY_LIST = CODING_AGENT_ACTION.historyList;
export const CB_ACTION_HISTORY_GET = CODING_AGENT_ACTION.historyGet;
export const CB_ACTION_HISTORY_MARK_READ = CODING_AGENT_ACTION.historyMarkRead;
export const CB_HISTORY_LIMIT = CODING_AGENT_HISTORY_LIMIT;
export const CB_ACTION_FS_LIST = 'fs.list';
export const CB_ACTION_CAPABILITIES_GET = CODING_AGENT_ACTION.capabilitiesGet;
export const CB_ACTION_PING = CODING_AGENT_ACTION.ping;

// --- Inner events: node -> browser -----------------------------------------
export const CB_EVENT_SESSION_STARTED = CODING_AGENT_EVENT.sessionStarted;
export const CB_EVENT_SESSION_IDENTIFIED = CODING_AGENT_EVENT.sessionIdentified;
export const CB_EVENT_SESSION_TEXT = CODING_AGENT_EVENT.sessionText;
export const CB_EVENT_SESSION_TEXT_DELTA = CODING_AGENT_EVENT.sessionTextDelta;
export const CB_EVENT_SESSION_THINKING = CODING_AGENT_EVENT.sessionThinking;
export const CB_EVENT_SESSION_TOOL_USE = CODING_AGENT_EVENT.sessionToolUse;
export const CB_EVENT_SESSION_TOOL_RESULT = CODING_AGENT_EVENT.sessionToolResult;
export const CB_EVENT_PERMISSION_REQUEST = CODING_AGENT_EVENT.permissionRequest;
export const CB_EVENT_PERMISSION_RESOLVED = CODING_AGENT_EVENT.permissionResolved;
export const CB_EVENT_PERMISSIONS_SNAPSHOT = CODING_AGENT_EVENT.permissionsSnapshot;
export const CB_EVENT_SESSION_RESULT = CODING_AGENT_EVENT.sessionResult;
export const CB_EVENT_SESSION_NOTICE = CODING_AGENT_EVENT.sessionNotice;
export const CB_EVENT_SESSION_ERROR = CODING_AGENT_EVENT.sessionError;
export const CB_EVENT_SESSION_CLOSED = CODING_AGENT_EVENT.sessionClosed;
export const CB_EVENT_SESSION_REWOUND = CODING_AGENT_EVENT.sessionRewound;
export const CB_EVENT_SESSION_STREAM_TRUNCATED = CODING_AGENT_EVENT.sessionStreamTruncated;
export const CB_EVENT_SESSIONS_SNAPSHOT = CODING_AGENT_EVENT.sessionsSnapshot;
export const CB_EVENT_HISTORY_SNAPSHOT = CODING_AGENT_EVENT.historySnapshot;
export const CB_EVENT_HISTORY_DETAIL = CODING_AGENT_EVENT.historyDetail;
export const CB_EVENT_FS_LIST = 'fs.list';
export const CB_EVENT_CAPABILITIES = CODING_AGENT_EVENT.capabilities;
export const CB_EVENT_PONG = CODING_AGENT_EVENT.pong;

// Reconnect backoff for the browser WebSocket (milliseconds).
export const CB_RECONNECT_MIN_MS = 1000;
export const CB_RECONNECT_MAX_MS = 15000;

// Sidebar navigation logo for the Coding Bridge feature.
export const CODING_BRIDGE_LOGO = 'https://cdn.acedata.cloud/0b28123f35.png';
