// Only the selected node, the last-opened history pointer, the composer prefs
// and the per-session event cursors survive a reload. Live nodes, sessions,
// events and permission prompts are rebuilt from the relay on reconnect, and the
// open conversation is re-read from the device, so persisting their contents
// would only show stale data.
//
// `lastSeq` is persisted so that after a full page reload the reconnect can ask
// the relay to `resume` each session's stream from the last event we applied —
// otherwise the cursor is empty, no replay is requested, and an actively
// streaming session looks frozen until the user sends something. A stale cursor
// (relay buffer trimmed) is self-healing: the relay replies `stream_truncated`
// and the session resyncs from the device transcript.
export default [
  'codingBridge.currentNodeId',
  'codingBridge.historyRef',
  'codingBridge.lastComposer',
  'codingBridge.lastSeq'
];
