import { describe, expect, it } from 'vitest';
import enChat from '@/i18n/en/chat.json';

import {
  CHAT_MODEL_DEEPSEEK_V4_FLASH,
  CHAT_MODEL_DEEPSEEK_V4_PRO,
  CHAT_MODEL_GPT_6_ASTRA,
  CHAT_MODEL_GPT_6_SOL,
  CHAT_MODEL_GPT_6_LUNA,
  CHAT_MODEL_GROK_4_7,
  CHAT_MODEL_GEMINI_3_8_FLASH,
  CHAT_MODEL_GPT_5_6_LUNA,
  CHAT_MODEL_GROUP_CHATGPT,
  CHAT_MODEL_GROUP_DEEPSEEK,
  CHAT_MODEL_GROUP_GROK,
  CHAT_MODEL_GROUP_GEMINI,
  CHAT_MODEL_GROUP_KIMI,
  CHAT_MODEL_KIMI_K2_6,
  CHAT_MODEL_KIMI_K3,
  CHAT_MODELS,
  CHAT_MODEL_GROUPS,
  getDefaultChatModel
} from './chat';

describe('chat models', () => {
  it('exposes Astra before GPT 5.6 tiers and makes Luna free', () => {
    expect(CHAT_MODEL_GROUP_CHATGPT.models.map((model) => model.name)).toEqual([
      'gpt-6-astra',
      'gpt-6-sol',
      'gpt-6-luna',
      'gpt-5.6-luna',
      'gpt-5.6-sol',
      'gpt-5.6-terra'
    ]);
    expect(CHAT_MODEL_GPT_5_6_LUNA.isFree).toBe(true);
    expect(CHAT_MODEL_GROUP_CHATGPT.models.filter((model) => model.isFree)).toEqual([CHAT_MODEL_GPT_5_6_LUNA]);
  });

  it('registers the new models in their provider groups', () => {
    expect(CHAT_MODEL_GROUP_CHATGPT.models.slice(0, 3)).toEqual([
      CHAT_MODEL_GPT_6_ASTRA,
      CHAT_MODEL_GPT_6_SOL,
      CHAT_MODEL_GPT_6_LUNA
    ]);
    expect(CHAT_MODEL_GROUP_GROK.models[0]).toBe(CHAT_MODEL_GROK_4_7);
    expect(CHAT_MODEL_GROUP_GEMINI.models[0]).toBe(CHAT_MODEL_GEMINI_3_8_FLASH);
    for (const model of [
      CHAT_MODEL_GPT_6_SOL,
      CHAT_MODEL_GPT_6_LUNA,
      CHAT_MODEL_GROK_4_7,
      CHAT_MODEL_GEMINI_3_8_FLASH
    ]) {
      expect(CHAT_MODELS).toContain(model);
      expect(model).toMatchObject({ isImageSupported: true, isReasoningSupported: true });
    }
  });

  it('defaults the ChatGPT group to Astra', () => {
    expect(getDefaultChatModel(CHAT_MODEL_GROUP_CHATGPT)).toBe(CHAT_MODEL_GPT_6_ASTRA);
  });

  it('advertises Astra multimodal and reasoning capabilities', () => {
    expect(CHAT_MODEL_GPT_6_ASTRA).toMatchObject({
      isImageSupported: true,
      isFileSupported: true,
      isReasoningSupported: true
    });
    expect(CHAT_MODELS).toContain(CHAT_MODEL_GPT_6_ASTRA);
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

  it('lists and registers both DeepSeek V4 tiers with Pro first', () => {
    expect(CHAT_MODEL_GROUP_DEEPSEEK.models.slice(0, 2)).toEqual([
      CHAT_MODEL_DEEPSEEK_V4_PRO,
      CHAT_MODEL_DEEPSEEK_V4_FLASH
    ]);
    expect(CHAT_MODELS).toContain(CHAT_MODEL_DEEPSEEK_V4_PRO);
    expect(CHAT_MODELS).toContain(CHAT_MODEL_DEEPSEEK_V4_FLASH);
  });

  it('advertises K3 multimodal and reasoning capabilities', () => {
    expect(CHAT_MODEL_KIMI_K3).toMatchObject({
      isImageSupported: true,
      isFileSupported: true,
      isReasoningSupported: true
    });
  });
});

describe('chat model catalog invariants', () => {
  const groupedModels = CHAT_MODEL_GROUPS.flatMap((group) => group.models);

  it('keeps the flat registry aligned with provider groups', () => {
    expect(new Set(CHAT_MODELS)).toEqual(new Set(groupedModels));
    expect(CHAT_MODELS).toHaveLength(groupedModels.length);
  });

  it('uses distinct human-readable names and descriptions', () => {
    const wireIds = new Set<string>(CHAT_MODELS.map((model) => model.name));
    const englishModelEntries = Object.entries(enChat).filter(
      ([key]) => key.startsWith('model.') && key !== 'model.freeTag'
    );
    const englishNames = englishModelEntries
      .filter(([key]) => !key.endsWith('Description'))
      .map(([, value]) => (value as { message: string }).message);
    const englishDescriptions = englishModelEntries
      .filter(([key]) => key.endsWith('Description'))
      .map(([, value]) => (value as { message: string }).message);

    expect(englishNames).toHaveLength(CHAT_MODELS.length);
    expect(new Set(englishNames).size).toBe(CHAT_MODELS.length);
    expect(englishNames.every((name) => !wireIds.has(name))).toBe(true);
    expect(new Set(englishDescriptions).size).toBe(CHAT_MODELS.length);
    expect(englishDescriptions.join(' ')).not.toMatch(/currently|latest|most advanced|suitable for most tasks/i);
  });

  it('registers every wire ID exactly once in the matching group', () => {
    expect(new Set(CHAT_MODELS.map((model) => model.name)).size).toBe(CHAT_MODELS.length);

    for (const group of CHAT_MODEL_GROUPS) {
      for (const model of group.models) {
        expect(model.modelGroup).toBe(group.name);
        expect(groupedModels.filter((candidate) => candidate.name === model.name)).toHaveLength(1);
      }
    }
  });
});
