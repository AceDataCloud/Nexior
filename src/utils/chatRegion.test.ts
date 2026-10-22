import { describe, expect, it } from 'vitest';
import { chatGroupAvailable, overseasChatRestricted } from './chatRegion';

describe('mainland chat availability', () => {
  const active = { country: 'cn', features: { CN_FOREIGN_CHAT_RESTRICTION: true } };

  it('hides only overseas chat groups when the global policy is active', () => {
    expect(overseasChatRestricted(active)).toBe(true);
    for (const group of ['chatgpt', 'claude', 'gemini', 'grok']) {
      expect(chatGroupAvailable(group, active)).toBe(false);
    }
    for (const group of ['deepseek', 'kimi', 'glm', 'openaiimage', 'grokvideo']) {
      expect(chatGroupAvailable(group, active)).toBe(true);
    }
  });

  it('keeps all groups when the switch is off or the IP is outside mainland China', () => {
    expect(chatGroupAvailable('chatgpt', { ...active, country: 'us' })).toBe(true);
    expect(chatGroupAvailable('chatgpt', { ...active, features: { CN_FOREIGN_CHAT_RESTRICTION: false } })).toBe(true);
    expect(chatGroupAvailable('chatgpt', undefined)).toBe(true);
  });
});
