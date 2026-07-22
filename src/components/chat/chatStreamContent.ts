import type { IChatMessageContentItem } from '@/models';

export interface ChatStreamContentState {
  contentParts: IChatMessageContentItem[];
  toolMap: Map<string, IChatMessageContentItem>;
  pendingToolIds: string[];
  committedToolIds: Set<string>;
  currentText: string;
  answerOffset: number;
}

export type StreamToolPatch = Omit<Partial<IChatMessageContentItem>, 'tool_id' | 'type'> & { tool_id: string };

export function createChatStreamContentState(): ChatStreamContentState {
  return {
    contentParts: [],
    toolMap: new Map(),
    pendingToolIds: [],
    committedToolIds: new Set(),
    currentText: '',
    answerOffset: 0
  };
}

export function upsertPendingTool(state: ChatStreamContentState, patch: StreamToolPatch): IChatMessageContentItem {
  let tool = state.toolMap.get(patch.tool_id);
  const definedPatch = Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));

  if (tool) {
    Object.assign(tool, definedPatch);
    return tool;
  }

  tool = {
    type: 'tool_use',
    status: 'running',
    ...definedPatch
  };
  state.toolMap.set(patch.tool_id, tool);
  state.pendingToolIds.push(patch.tool_id);
  return tool;
}

export function setStreamText(state: ChatStreamContentState, answer: string): void {
  state.currentText = answer.slice(state.answerOffset);
}

export function flushStreamText(state: ChatStreamContentState, answerLength: number): void {
  if (state.currentText) {
    state.contentParts.push({ type: 'text', text: state.currentText });
    state.currentText = '';
  }
  state.answerOffset = answerLength;
}

export function commitStreamTool(
  state: ChatStreamContentState,
  toolId: string,
  answerLength: number
): IChatMessageContentItem | undefined {
  const tool = state.toolMap.get(toolId);
  if (!tool || state.committedToolIds.has(toolId)) return tool;

  flushStreamText(state, answerLength);
  state.contentParts.push(tool);
  state.committedToolIds.add(toolId);
  state.pendingToolIds = state.pendingToolIds.filter((id) => id !== toolId);
  return tool;
}

export function getStreamDisplayParts(state: ChatStreamContentState): IChatMessageContentItem[] {
  const parts = [...state.contentParts];
  if (state.currentText) {
    parts.push({ type: 'text', text: state.currentText });
  }
  for (const toolId of state.pendingToolIds) {
    const tool = state.toolMap.get(toolId);
    if (tool) parts.push(tool);
  }
  return parts;
}
