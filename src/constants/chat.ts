import i18n from '@/i18n';
import { IChatModel, IChatModelGroup } from '@/models';

export const ROLE_SYSTEM = 'system';
export const ROLE_ASSISTANT = 'assistant';
export const ROLE_USER = 'user';

export const CHAT_MODEL_NAME_GPT_5_5 = 'gpt-5.5';
export const CHAT_MODEL_NAME_GPT_5_4 = 'gpt-5.4';
export const CHAT_MODEL_NAME_GPT_5_4_MINI = 'gpt-5.4-mini';
export const CHAT_MODEL_NAME_DEEPSEEK_CHAT = 'deepseek-v3';
export const CHAT_MODEL_NAME_DEEPSEEK32_CHAT = 'deepseek-v3.2-exp';
export const CHAT_MODEL_NAME_DEEPSEEK_V4_FLASH = 'deepseek-v4-flash';
export const CHAT_MODEL_NAME_DEEPSEEK_REASONER = 'deepseek-r1';
export const CHAT_MODEL_NAME_GROK_4 = 'grok-4';
export const CHAT_MODEL_NAME_GROK_3 = 'grok-3';
export const CHAT_MODEL_NAME_GEMINI_3_0_PRO = 'gemini-3.0-pro';
export const CHAT_MODEL_NAME_GEMINI_2_5_PRO = 'gemini-2.5-pro';
export const CHAT_MODEL_NAME_GEMINI_2_5_FLASH = 'gemini-2.5-flash';
export const CHAT_MODEL_NAME_CLAUDE_OPUS_4_7 = 'claude-opus-4-7';
export const CHAT_MODEL_NAME_CLAUDE_SONNET_4_6 = 'claude-sonnet-4-6';
export const CHAT_MODEL_NAME_CLAUDE_HAIKU_4_5 = 'claude-haiku-4-5-20251001';

export const CHAT_MODEL_NAME_KIMI_K2_5 = 'kimi-k2.5';
export const CHAT_MODEL_NAME_KIMI_K2_THINKING = 'kimi-k2-thinking';
export const CHAT_MODEL_NAME_KIMI_K2_THINKING_TURBO = 'kimi-k2-thinking-turbo';

export const CHAT_MODEL_NAME_GLM_5_1 = 'glm-5.1';
export const CHAT_MODEL_NAME_GLM_4_7 = 'glm-4.7';

export const CHAT_MODEL_ICON_CHATGPT = 'https://cdn.acedata.cloud/7dljuv.png';
export const CHAT_MODEL_ICON_GROK = 'https://cdn.acedata.cloud/p1ge98.png';
export const CHAT_MODEL_ICON_DEEPSEEK = 'https://cdn.acedata.cloud/bc71ae.png';
export const CHAT_MODEL_ICON_GEMINI = 'https://cdn.acedata.cloud/psfx0g.jpg';
export const CHAT_MODEL_ICON_CLAUDE = 'https://cdn.acedata.cloud/8fnw4v.jpg';
export const CHAT_MODEL_ICON_KIMI = 'https://cdn.acedata.cloud/57ebgy.png';
export const CHAT_MODEL_ICON_GLM = 'https://cdn.acedata.cloud/jqi3nv.png';

export const CHAT_SERVICE_ID = 'b1fbcc32-e218-4253-9dc3-4fe600a1bfb9';

export const CHAT_MODEL_GPT_5_5: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GPT_5_5,
  icon: CHAT_MODEL_ICON_CHATGPT,
  modelGroup: 'chatgpt',
  isFileSupported: true,
  isImageSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.55'),
  getDescription: () => i18n.global.t('chat.model.55Description')
};

export const CHAT_MODEL_GPT_5_4: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GPT_5_4,
  icon: CHAT_MODEL_ICON_CHATGPT,
  modelGroup: 'chatgpt',
  isFileSupported: true,
  isImageSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.54'),
  getDescription: () => i18n.global.t('chat.model.54Description')
};

export const CHAT_MODEL_GPT_5_4_MINI: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GPT_5_4_MINI,
  icon: CHAT_MODEL_ICON_CHATGPT,
  modelGroup: 'chatgpt',
  isFileSupported: true,
  isImageSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.54Mini'),
  getDescription: () => i18n.global.t('chat.model.54MiniDescription')
};

export const CHAT_MODEL_DEEPSEEK_CHAT: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_DEEPSEEK_CHAT,
  icon: CHAT_MODEL_ICON_DEEPSEEK,
  modelGroup: 'deepseek',
  getDisplayName: () => i18n.global.t('chat.model.deepseekChat'),
  getDescription: () => i18n.global.t('chat.model.deepseekChatDescription')
};

export const CHAT_MODEL_DEEPSEEK_CHAT32: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_DEEPSEEK32_CHAT,
  icon: CHAT_MODEL_ICON_DEEPSEEK,
  modelGroup: 'deepseek',
  getDisplayName: () => i18n.global.t('chat.model.deepseekChat32'),
  getDescription: () => i18n.global.t('chat.model.deepseekChat32Description')
};

export const CHAT_MODEL_DEEPSEEK_V4_FLASH: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_DEEPSEEK_V4_FLASH,
  icon: CHAT_MODEL_ICON_DEEPSEEK,
  modelGroup: 'deepseek',
  getDisplayName: () => i18n.global.t('chat.model.deepseekV4Flash'),
  getDescription: () => i18n.global.t('chat.model.deepseekV4FlashDescription')
};

export const CHAT_MODEL_DEEPSEEK_REASONER: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_DEEPSEEK_REASONER,
  icon: CHAT_MODEL_ICON_DEEPSEEK,
  modelGroup: 'deepseek',
  getDisplayName: () => i18n.global.t('chat.model.deepseekReasoner'),
  getDescription: () => i18n.global.t('chat.model.deepseekReasonerDescription')
};

export const CHAT_MODEL_GROK_4: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GROK_4,
  icon: CHAT_MODEL_ICON_GROK,
  modelGroup: 'grok',
  isImageSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.grok4'),
  getDescription: () => i18n.global.t('chat.model.grok4Description')
};

export const CHAT_MODEL_GROK_3: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GROK_3,
  icon: CHAT_MODEL_ICON_GROK,
  modelGroup: 'grok',
  getDisplayName: () => i18n.global.t('chat.model.grok3'),
  getDescription: () => i18n.global.t('chat.model.grok3Description')
};

export const CHAT_MODEL_GEMINI_3_0_PRO: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GEMINI_3_0_PRO,
  icon: CHAT_MODEL_ICON_GEMINI,
  modelGroup: 'gemini',
  isImageSupported: true,
  isFileSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.gemini30Pro'),
  getDescription: () => i18n.global.t('chat.model.gemini30ProDescription')
};

export const CHAT_MODEL_GEMINI_2_5_PRO: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GEMINI_2_5_PRO,
  icon: CHAT_MODEL_ICON_GEMINI,
  modelGroup: 'gemini',
  isImageSupported: true,
  isFileSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.gemini25Pro'),
  getDescription: () => i18n.global.t('chat.model.gemini25ProDescription')
};

export const CHAT_MODEL_GEMINI_2_5_FLASH: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GEMINI_2_5_FLASH,
  icon: CHAT_MODEL_ICON_GEMINI,
  modelGroup: 'gemini',
  isImageSupported: true,
  isFileSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.gemini25Flash'),
  getDescription: () => i18n.global.t('chat.model.gemini25FlashDescription')
};

export const CHAT_MODEL_CLAUDE_OPUS_4_7: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_CLAUDE_OPUS_4_7,
  icon: CHAT_MODEL_ICON_CLAUDE,
  modelGroup: 'claude',
  isImageSupported: true,
  isFileSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.claudeOpus47'),
  getDescription: () => i18n.global.t('chat.model.claudeOpus47Description')
};

export const CHAT_MODEL_CLAUDE_SONNET_4_6: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_CLAUDE_SONNET_4_6,
  icon: CHAT_MODEL_ICON_CLAUDE,
  modelGroup: 'claude',
  isImageSupported: true,
  isFileSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.claudeSonnet46'),
  getDescription: () => i18n.global.t('chat.model.claudeSonnet46Description')
};

export const CHAT_MODEL_CLAUDE_HAIKU_4_5: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_CLAUDE_HAIKU_4_5,
  icon: CHAT_MODEL_ICON_CLAUDE,
  modelGroup: 'claude',
  isImageSupported: true,
  isFileSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.claudeHaiku45'),
  getDescription: () => i18n.global.t('chat.model.claudeHaiku45Description')
};

export const CHAT_MODEL_KIMI_K2_5: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_KIMI_K2_5,
  icon: CHAT_MODEL_ICON_KIMI,
  modelGroup: 'kimi',
  getDisplayName: () => i18n.global.t('chat.model.kimiK25'),
  getDescription: () => i18n.global.t('chat.model.kimiK25Description')
};

export const CHAT_MODEL_KIMI_K2_THINKING: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_KIMI_K2_THINKING,
  icon: CHAT_MODEL_ICON_KIMI,
  modelGroup: 'kimi',
  isReasoningSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.kimiK2Thinking'),
  getDescription: () => i18n.global.t('chat.model.kimiK2ThinkingDescription')
};

export const CHAT_MODEL_KIMI_K2_THINKING_TURBO: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_KIMI_K2_THINKING_TURBO,
  icon: CHAT_MODEL_ICON_KIMI,
  modelGroup: 'kimi',
  isReasoningSupported: true,
  getDisplayName: () => i18n.global.t('chat.model.kimiK2ThinkingTurbo'),
  getDescription: () => i18n.global.t('chat.model.kimiK2ThinkingTurboDescription')
};

export const CHAT_MODEL_GLM_5_1: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GLM_5_1,
  icon: CHAT_MODEL_ICON_GLM,
  modelGroup: 'glm',
  getDisplayName: () => i18n.global.t('chat.model.glm51'),
  getDescription: () => i18n.global.t('chat.model.glm51Description')
};

export const CHAT_MODEL_GLM_4_7: IChatModel = {
  enabled: true,
  name: CHAT_MODEL_NAME_GLM_4_7,
  icon: CHAT_MODEL_ICON_GLM,
  modelGroup: 'glm',
  getDisplayName: () => i18n.global.t('chat.model.glm47'),
  getDescription: () => i18n.global.t('chat.model.glm47Description')
};

export const CHAT_MODEL_GROUP_CHATGPT: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_CHATGPT,
  name: 'chatgpt',
  getDisplayName: () => i18n.global.t('chat.modelGroup.chatgpt'),
  getDescription: () => i18n.global.t('chat.modelGroup.chatgptDescription'),
  models: [CHAT_MODEL_GPT_5_5, CHAT_MODEL_GPT_5_4, CHAT_MODEL_GPT_5_4_MINI]
};

export const CHAT_MODEL_GROUP_DEEPSEEK: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_DEEPSEEK,
  name: 'deepseek',
  getDisplayName: () => i18n.global.t('chat.modelGroup.deepseek'),
  getDescription: () => i18n.global.t('chat.modelGroup.deepseekDescription'),
  models: [CHAT_MODEL_DEEPSEEK_V4_FLASH, CHAT_MODEL_DEEPSEEK_CHAT, CHAT_MODEL_DEEPSEEK_CHAT32, CHAT_MODEL_DEEPSEEK_REASONER]
};

export const CHAT_MODEL_GROUP_GROK: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_GROK,
  name: 'grok',
  getDisplayName: () => i18n.global.t('chat.modelGroup.grok'),
  getDescription: () => i18n.global.t('chat.modelGroup.grokDescription'),
  models: [CHAT_MODEL_GROK_4, CHAT_MODEL_GROK_3]
};

export const CHAT_MODEL_GROUP_GEMINI: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_GEMINI,
  name: 'gemini',
  getDisplayName: () => i18n.global.t('chat.modelGroup.gemini'),
  getDescription: () => i18n.global.t('chat.modelGroup.geminiDescription'),
  models: [CHAT_MODEL_GEMINI_3_0_PRO, CHAT_MODEL_GEMINI_2_5_PRO, CHAT_MODEL_GEMINI_2_5_FLASH]
};

export const CHAT_MODEL_GROUP_CLAUDE: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_CLAUDE,
  name: 'claude',
  getDisplayName: () => i18n.global.t('chat.modelGroup.claude'),
  getDescription: () => i18n.global.t('chat.modelGroup.claudeDescription'),
  models: [CHAT_MODEL_CLAUDE_OPUS_4_7, CHAT_MODEL_CLAUDE_SONNET_4_6, CHAT_MODEL_CLAUDE_HAIKU_4_5]
};

export const CHAT_MODEL_GROUP_KIMI: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_KIMI,
  name: 'kimi',
  getDisplayName: () => i18n.global.t('chat.modelGroup.kimi'),
  getDescription: () => i18n.global.t('chat.modelGroup.kimiDescription'),
  models: [CHAT_MODEL_KIMI_K2_5, CHAT_MODEL_KIMI_K2_THINKING, CHAT_MODEL_KIMI_K2_THINKING_TURBO]
};

export const CHAT_MODEL_GROUP_GLM: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_GLM,
  name: 'glm',
  getDisplayName: () => i18n.global.t('chat.modelGroup.glm'),
  getDescription: () => i18n.global.t('chat.modelGroup.glmDescription'),
  models: [CHAT_MODEL_GLM_5_1, CHAT_MODEL_GLM_4_7]
};

export const CHAT_MODELS: IChatModel[] = [
  CHAT_MODEL_GPT_5_5,
  CHAT_MODEL_GPT_5_4,
  CHAT_MODEL_GPT_5_4_MINI,
  CHAT_MODEL_DEEPSEEK_CHAT,
  CHAT_MODEL_DEEPSEEK_REASONER,
  CHAT_MODEL_GROK_4,
  CHAT_MODEL_GROK_3,
  CHAT_MODEL_GEMINI_3_0_PRO,
  CHAT_MODEL_GEMINI_2_5_PRO,
  CHAT_MODEL_GEMINI_2_5_FLASH,
  CHAT_MODEL_CLAUDE_OPUS_4_7,
  CHAT_MODEL_CLAUDE_SONNET_4_6,
  CHAT_MODEL_CLAUDE_HAIKU_4_5,
  CHAT_MODEL_KIMI_K2_5,
  CHAT_MODEL_KIMI_K2_THINKING,
  CHAT_MODEL_KIMI_K2_THINKING_TURBO,
  CHAT_MODEL_GLM_5_1,
  CHAT_MODEL_GLM_4_7
];

export const CHAT_MODEL_GROUPS: IChatModelGroup[] = [
  CHAT_MODEL_GROUP_CHATGPT,
  CHAT_MODEL_GROUP_DEEPSEEK,
  CHAT_MODEL_GROUP_GROK,
  CHAT_MODEL_GROUP_GEMINI,
  CHAT_MODEL_GROUP_CLAUDE,
  CHAT_MODEL_GROUP_KIMI,
  CHAT_MODEL_GROUP_GLM
];
