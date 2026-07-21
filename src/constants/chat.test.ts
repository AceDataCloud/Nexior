import { describe, expect, it } from 'vitest';

import { CHAT_MODEL_GROUP_KIMI, CHAT_MODEL_KIMI_K2_6, CHAT_MODEL_KIMI_K3, CHAT_MODELS } from './chat';

describe('Kimi chat models', () => {
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
