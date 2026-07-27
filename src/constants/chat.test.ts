import { describe, expect, it } from 'vitest';

import {
  CHAT_MODEL_GPT_5_6_LUNA,
  CHAT_MODEL_GPT_5_6_SOL,
  CHAT_MODEL_GROUP_CHATGPT,
  CHAT_MODEL_GROUP_KIMI,
  CHAT_MODEL_KIMI_K2_6,
  CHAT_MODEL_KIMI_K3,
  CHAT_MODELS,
  getDefaultChatModel
} from './chat';

describe('chat models', () => {
  it('exposes only GPT 5.6 tiers and makes Luna free', () => {
    expect(CHAT_MODEL_GROUP_CHATGPT.models.map((model) => model.name)).toEqual([
      'gpt-5.6-luna',
      'gpt-5.6-sol',
      'gpt-5.6-terra'
    ]);
    expect(CHAT_MODEL_GPT_5_6_LUNA.isFree).toBe(true);
    expect(CHAT_MODEL_GROUP_CHATGPT.models.filter((model) => model.isFree)).toEqual([CHAT_MODEL_GPT_5_6_LUNA]);
  });

  it('defaults the ChatGPT group to Sol, not the first listed model', () => {
    expect(getDefaultChatModel(CHAT_MODEL_GROUP_CHATGPT)).toBe(CHAT_MODEL_GPT_5_6_SOL);
  });

  it('falls back to the first model for groups without an explicit default', () => {
    expect(getDefaultChatModel(CHAT_MODEL_GROUP_KIMI)).toBe(CHAT_MODEL_GROUP_KIMI.models[0]);
  });

  it('lists K3 first and registers both current Kimi models', () => {
    expect(CHAT_MODEL_GROUP_KIMI.models[0]).toBe(CHAT_MODEL_KIMI_K3);
    expect(CHAT_MODEL_GROUP_KIMI.models).toContain(CHAT_MODEL_KIMI_K2_6);
    expect(CHAT_MODELS).toContain(CHAT_MODEL_KIMI_K3);
    expect(CHAT_MODELS).toContain(CHAT_MODEL_KIMI_K2_6);
  });

  it('advertises K3 multimodal and reasoning capabilities', () => {
    expect(CHAT_MODEL_KIMI_K3).toMatchObject({
      isImageSupported: true,
      isFileSupported: true,
      isReasoningSupported: true
    });
  });
});
