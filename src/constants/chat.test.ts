import { describe, expect, it } from 'vitest';
import enChat from '@/i18n/en/chat.json';
import { selectableChatModels } from '@/utils/modelPresentation';

import {
  findSavedChatModel,
  CHAT_MODEL_DEEPSEEK_V4_FLASH,
  CHAT_MODEL_DEEPSEEK_V4_PRO,
  CHAT_MODEL_GPT_6_2_ASTRA,
  CHAT_MODEL_GPT_6_2_SOL,
  CHAT_MODEL_GPT_6_ASTRA,
  CHAT_MODEL_GPT_6_1_SOL,
  CHAT_MODEL_GPT_6_1_TERRA,
  CHAT_MODEL_GPT_6_SOL,
  CHAT_MODEL_GPT_6_LUNA,
  CHAT_MODEL_GROK_4_7,
  CHAT_MODEL_GEMINI_3_8_FLASH,
  CHAT_MODEL_GEMINI_4_ARGON,
  CHAT_MODEL_GEMINI_4_CARBON,
  CHAT_MODEL_GEMINI_4_HYDROGEN,
  CHAT_MODEL_GPT_5_6_LUNA,
  CHAT_MODEL_GROUP_CHATGPT,
  CHAT_MODEL_GROUP_DEEPSEEK,
  CHAT_MODEL_GROUP_GROK,
  CHAT_MODEL_GROUP_GEMINI,
  CHAT_MODEL_GROUP_KIMI,
  CHAT_MODEL_KIMI_K2_6,
  CHAT_MODEL_KIMI_K3_1_PRO,
  CHAT_MODEL_KIMI_K3,
  CHAT_MODELS,
  CHAT_MODEL_GROUPS,
  getDefaultChatModel
} from './chat';

describe('chat models', () => {
  it('exposes GPT 6.2 before earlier tiers and makes Luna free', () => {
    expect(CHAT_MODEL_GROUP_CHATGPT.models.map((model) => model.name)).toEqual([
      'gpt-6.2-astra',
      'gpt-6.2-sol',
      'gpt-6-astra',
      'gpt-6.1-sol',
      'gpt-6.1-terra',
      'gpt-6-sol',
      'gpt-6-luna',
      'gpt-5.6-luna',
      'gpt-5.6-sol',
      'gpt-5.6-sol-fast',
      'gpt-5.6-terra'
    ]);
    expect(CHAT_MODEL_GPT_5_6_LUNA.isFree).toBe(true);
    expect(CHAT_MODEL_GROUP_CHATGPT.models.filter((model) => model.isFree)).toEqual([CHAT_MODEL_GPT_5_6_LUNA]);
  });

  it('registers the new models in their provider groups', () => {
    expect(CHAT_MODEL_GROUP_CHATGPT.models.slice(0, 7)).toEqual([
      CHAT_MODEL_GPT_6_2_ASTRA,
      CHAT_MODEL_GPT_6_2_SOL,
      CHAT_MODEL_GPT_6_ASTRA,
      CHAT_MODEL_GPT_6_1_SOL,
      CHAT_MODEL_GPT_6_1_TERRA,
      CHAT_MODEL_GPT_6_SOL,
      CHAT_MODEL_GPT_6_LUNA
    ]);
    expect(CHAT_MODEL_GROUP_GROK.models[0]).toBe(CHAT_MODEL_GROK_4_7);
    expect(CHAT_MODEL_GROUP_GEMINI.models[0]).toBe(CHAT_MODEL_GEMINI_3_8_FLASH);
    expect(CHAT_MODEL_GROUP_GEMINI.models[1]).toBe(CHAT_MODEL_GEMINI_4_ARGON);
    for (const model of [
      CHAT_MODEL_GPT_6_2_ASTRA,
      CHAT_MODEL_GPT_6_2_SOL,
      CHAT_MODEL_GPT_6_1_SOL,
      CHAT_MODEL_GPT_6_1_TERRA,
      CHAT_MODEL_GPT_6_SOL,
      CHAT_MODEL_GPT_6_LUNA,
      CHAT_MODEL_GROK_4_7,
      CHAT_MODEL_GEMINI_3_8_FLASH,
      CHAT_MODEL_GEMINI_4_ARGON,
      CHAT_MODEL_GEMINI_4_CARBON,
      CHAT_MODEL_GEMINI_4_HYDROGEN
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

  it('preserves K3 as the default Kimi model', () => {
    expect(getDefaultChatModel(CHAT_MODEL_GROUP_KIMI)).toBe(CHAT_MODEL_KIMI_K3);
  });

  it('offers exactly the four supported Kimi models', () => {
    expect(CHAT_MODEL_GROUP_KIMI.models[0]).toBe(CHAT_MODEL_KIMI_K3_1_PRO);
    expect(CHAT_MODEL_KIMI_K3_1_PRO.enabled).toBe(true);
    expect(CHAT_MODEL_GROUP_KIMI.models.map((model) => model.name)).toEqual([
      'kimi-k3.1-pro',
      'kimi-k3',
      'kimi-k2.6',
      'kimi-k2.7-code'
    ]);
    expect(CHAT_MODEL_KIMI_K3.enabled).toBe(true);
    expect(CHAT_MODEL_GROUP_KIMI.models).toContain(CHAT_MODEL_KIMI_K3);
    expect(CHAT_MODEL_GROUP_KIMI.models).toContain(CHAT_MODEL_KIMI_K2_6);
    expect(CHAT_MODELS).toContain(CHAT_MODEL_KIMI_K3_1_PRO);
    expect(CHAT_MODELS).toContain(CHAT_MODEL_KIMI_K3);
    expect(CHAT_MODELS).toContain(CHAT_MODEL_KIMI_K2_6);
  });

  it('offers five DeepSeek wire IDs for new chats and schedules with Pro first', () => {
    const models = selectableChatModels(undefined, CHAT_MODEL_GROUP_DEEPSEEK);
    expect(models.map((model) => model.name)).toEqual([
      'deepseek-v4-pro',
      'deepseek-v4-flash',
      'deepseek-v4.1-flash',
      'deepseek-flash',
      'deepseek-v3.2'
    ]);
    expect(models[0]).toBe(CHAT_MODEL_DEEPSEEK_V4_PRO);
    expect(models[1]).toBe(CHAT_MODEL_DEEPSEEK_V4_FLASH);
    for (const model of models) expect(findSavedChatModel(model.name)).toBe(model);
  });

  it('resolves historical DeepSeek IDs for saved records without offering them for new requests', () => {
    const models = selectableChatModels(undefined, CHAT_MODEL_GROUP_DEEPSEEK);
    for (const name of [
      'deepseek-v3',
      'deepseek-r1',
      'deepseek-v3.2-exp',
      'deepseek-chat',
      'deepseek-reasoner',
      'deepseek-0324',
      'deepseek-250324',
      'deepseek-v3-250324',
      'deepseek-r1-0528'
    ]) {
      expect(findSavedChatModel(name)).toMatchObject({ name, modelGroup: 'deepseek', enabled: false });
      expect(models.some((model) => model.name === name)).toBe(false);
    }
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
