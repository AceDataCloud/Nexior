import type { IConfigResponse } from '@/models/config';

const OVERSEAS_CHAT_GROUPS = new Set(['chatgpt', 'claude', 'gemini', 'grok']);

export function overseasChatRestricted(config: IConfigResponse | undefined): boolean {
  return config?.features?.CN_FOREIGN_CHAT_RESTRICTION === true && config?.country?.toLowerCase() === 'cn';
}

export function chatGroupAvailable(group: string, config: IConfigResponse | undefined): boolean {
  return !overseasChatRestricted(config) || !OVERSEAS_CHAT_GROUPS.has(group);
}
