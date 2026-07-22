import { describe, expect, it } from 'vitest';
import {
  commitStreamTool,
  createChatStreamContentState,
  getStreamDisplayParts,
  setStreamText,
  upsertPendingTool
} from './chatStreamContent';

describe('chatStreamContent', () => {
  it('keeps text contiguous around an early tool announcement across turns', () => {
    const state = createChatStreamContentState();

    setStreamText(state, 'AceDat');
    upsertPendingTool(state, { tool_id: 'tool_1', tool_name: 'Bash', input: {} });
    setStreamText(state, 'AceDataCloud');

    expect(getStreamDisplayParts(state)).toEqual([
      { type: 'text', text: 'AceDataCloud' },
      expect.objectContaining({ type: 'tool_use', tool_id: 'tool_1' })
    ]);

    commitStreamTool(state, 'tool_1', 'AceDataCloud'.length);
    setStreamText(state, 'AceDataCloudChecking status');
    upsertPendingTool(state, { tool_id: 'tool_2', tool_name: 'Bash', input: {} });

    expect(getStreamDisplayParts(state)).toEqual([
      { type: 'text', text: 'AceDataCloud' },
      expect.objectContaining({ type: 'tool_use', tool_id: 'tool_1' }),
      { type: 'text', text: 'Checking status' },
      expect.objectContaining({ type: 'tool_use', tool_id: 'tool_2' })
    ]);
  });

  it('keeps parallel pending tools ordered after the complete turn text', () => {
    const state = createChatStreamContentState();

    setStreamText(state, 'Checking');
    upsertPendingTool(state, { tool_id: 'tool_1', tool_name: 'first', input: {} });
    upsertPendingTool(state, { tool_id: 'tool_2', tool_name: 'second', input: {} });
    setStreamText(state, 'Checking both services');

    expect(getStreamDisplayParts(state)).toEqual([
      { type: 'text', text: 'Checking both services' },
      expect.objectContaining({ tool_id: 'tool_1' }),
      expect.objectContaining({ tool_id: 'tool_2' })
    ]);

    commitStreamTool(state, 'tool_1', 'Checking both services'.length);
    commitStreamTool(state, 'tool_2', 'Checking both services'.length);
    expect(state.contentParts).toEqual([
      { type: 'text', text: 'Checking both services' },
      expect.objectContaining({ tool_id: 'tool_1' }),
      expect.objectContaining({ tool_id: 'tool_2' })
    ]);
  });
});
