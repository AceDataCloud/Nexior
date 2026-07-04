import type { IChatConversation } from '@/models';

export function hasLoadedConversationMessages(conversation: IChatConversation | undefined): boolean {
  return Array.isArray(conversation?.messages) && conversation.messages.length > 0;
}
