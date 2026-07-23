import type { IChatConversation } from '@/models';

/**
 * Return a side-panel-safe copy of a conversation with its heavy `messages`
 * dropped. Full histories (which can carry inline base64 browser-agent
 * screenshots) must never enter `state.chat.conversations` — that array is
 * persisted to localStorage and re-serialized by vuex-persistedstate on every
 * mutation, so a full-history copy makes each keystroke/stream tick stringify
 * hundreds of MB and freezes the tab. The renderer keeps full messages in the
 * component-local `this.messages`; the store list only needs summaries.
 */
export function stripConversationMessages(conversation: IChatConversation): IChatConversation {
  if (!conversation || conversation.messages === undefined) return conversation;
  const { messages: _messages, ...summary } = conversation;
  return summary;
}
