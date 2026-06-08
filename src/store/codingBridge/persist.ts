// Only the selected node survives a reload. Live nodes, sessions, events and
// permission prompts are rebuilt from the relay on reconnect, so persisting
// them would only show stale data.
export default ['codingBridge.currentNodeId'];
