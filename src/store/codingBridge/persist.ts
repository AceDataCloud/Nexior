// Only the selected node and the last-opened history pointer survive a reload.
// Live nodes, sessions, events and permission prompts are rebuilt from the
// relay on reconnect, and the open conversation is re-read from the device, so
// persisting their contents would only show stale data.
export default ['codingBridge.currentNodeId', 'codingBridge.historyRef'];
