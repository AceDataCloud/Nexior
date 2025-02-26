import i18n from '@/i18n';
import { IChatModel, IChatModelGroup } from '@/models';

export const ROLE_SYSTEM = 'system';
export const ROLE_ASSISTANT = 'assistant';
export const ROLE_USER = 'user';

export const CHAT_MODEL_NAME_GPT_3_5 = 'gpt-3.5';
export const CHAT_MODEL_NAME_GPT_3_5_BROWSING = 'gpt-3.5-browsing';
export const CHAT_MODEL_NAME_GPT_4 = 'gpt-4';
export const CHAT_MODEL_NAME_GPT_4_BROWSING = 'gpt-4-browsing';
export const CHAT_MODEL_NAME_GPT_4_VISION = 'gpt-4-vision';
export const CHAT_MODEL_NAME_GPT_4_ALL = 'gpt-4-all';
export const CHAT_MODEL_NAME_GPT_4O = 'gpt-4o';
export const CHAT_MODEL_NAME_O1 = 'o1';
export const CHAT_MODEL_NAME_O1_MINI = 'o1-mini';
export const CHAT_MODEL_NAME_O3_MINI = 'o3-mini';
export const CHAT_MODEL_NAME_DEEPSEEK_CHAT = 'deepseek-chat';
export const CHAT_MODEL_NAME_DEEPSEEK_REASONER = 'deepseek-reasoner';
export const CHAT_MODEL_NAME_GROK_3 = 'grok-3';
export const CHAT_MODEL_NAME_GROK_3_REASONER = 'grok-3-reasoner';
export const CHAT_MODEL_NAME_GROK_3_DEEPSEARCH = 'grok-3-deepsearch';

export const CHAT_MODEL_ICON_OPENAI = 'https://cdn.acedata.cloud/7dljuv.png';
export const CHAT_MODEL_ICON_GROK = 'https://cdn.acedata.cloud/p1ge98.png';
export const CHAT_MODEL_ICON_DEEPSEEK = 'https://cdn.acedata.cloud/bc71ae.png';

export const CHAT_SERVICE_ID = 'b1fbcc32-e218-4253-9dc3-4fe600a1bfb9';

export const CHAT_MODEL_GPT_3_5: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_3_5,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.35Standard'),
  getDescription: () => i18n.global.t('chat.model.35StandardDescription')
};

export const CHAT_MODEL_GPT_3_5_BROWSING: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_3_5_BROWSING,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.35Browsing'),
  getDescription: () => i18n.global.t('chat.model.35BrowsingDescription')
};

export const CHAT_MODEL_GPT_4: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.4Standard'),
  getDescription: () => i18n.global.t('chat.model.4StandardDescription')
};

export const CHAT_MODEL_GPT_4_BROWSING: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4_BROWSING,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.4Browsing'),
  getDescription: () => i18n.global.t('chat.model.4BrowsingDescription')
};

export const CHAT_MODEL_GPT_4_VISION: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4_VISION,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.4Vision'),
  getDescription: () => i18n.global.t('chat.model.4VisionDescription')
};

export const CHAT_MODEL_GPT_4_ALL: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4_ALL,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.4All'),
  getDescription: () => i18n.global.t('chat.model.4AllDescription')
};

export const CHAT_MODEL_GPT_4O: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4O,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.4O'),
  getDescription: () => i18n.global.t('chat.model.4ODescription')
};

export const CHAT_MODEL_DEEPSEEK_CHAT: IChatModel = {
  name: CHAT_MODEL_NAME_DEEPSEEK_CHAT,
  icon: CHAT_MODEL_ICON_DEEPSEEK,
  getDisplayName: () => i18n.global.t('chat.model.deepseekChat'),
  getDescription: () => i18n.global.t('chat.model.deepseekChatDescription')
};

export const CHAT_MODEL_DEEPSEEK_REASONER: IChatModel = {
  name: CHAT_MODEL_NAME_DEEPSEEK_REASONER,
  icon: CHAT_MODEL_ICON_DEEPSEEK,
  getDisplayName: () => i18n.global.t('chat.model.deepseekReasoner'),
  getDescription: () => i18n.global.t('chat.model.deepseekReasonerDescription')
};

export const CHAT_MODEL_O1: IChatModel = {
  name: CHAT_MODEL_NAME_O1,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.o1'),
  getDescription: () => i18n.global.t('chat.model.o1Description')
};

export const CHAT_MODEL_O1_MINI: IChatModel = {
  name: CHAT_MODEL_NAME_O1_MINI,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.o1Mini'),
  getDescription: () => i18n.global.t('chat.model.o1MiniDescription')
};

export const CHAT_MODEL_O3_MINI: IChatModel = {
  name: CHAT_MODEL_NAME_O3_MINI,
  icon: CHAT_MODEL_ICON_OPENAI,
  getDisplayName: () => i18n.global.t('chat.model.o3Mini'),
  getDescription: () => i18n.global.t('chat.model.o3MiniDescription')
};

export const CHAT_MODEL_GROK_3: IChatModel = {
  name: CHAT_MODEL_NAME_GROK_3,
  icon: CHAT_MODEL_ICON_GROK,
  getDisplayName: () => i18n.global.t('chat.model.grok3'),
  getDescription: () => i18n.global.t('chat.model.grok3Description')
};

export const CHAT_MODEL_GROK_3_REASONER: IChatModel = {
  name: CHAT_MODEL_NAME_GROK_3_REASONER,
  icon: CHAT_MODEL_ICON_GROK,
  getDisplayName: () => i18n.global.t('chat.model.grok3Reasoner'),
  getDescription: () => i18n.global.t('chat.model.grok3ReasonerDescription')
};

export const CHAT_MODEL_GROK_3_DEEPSEARCH: IChatModel = {
  name: CHAT_MODEL_NAME_GROK_3_DEEPSEARCH,
  icon: CHAT_MODEL_ICON_GROK,
  getDisplayName: () => i18n.global.t('chat.model.grok3Deepsearch'),
  getDescription: () => i18n.global.t('chat.model.grok3DeepsearchDescription')
};

export const CHAT_MODEL_GROUP_CHATGPT: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_OPENAI,
  name: 'chatgpt',
  getDisplayName: () => i18n.global.t('chat.modelGroup.chatgpt'),
  getDescription: () => i18n.global.t('chat.modelGroup.chatgptDescription'),
  models: [
    CHAT_MODEL_GPT_3_5,
    CHAT_MODEL_GPT_3_5_BROWSING,
    CHAT_MODEL_GPT_4,
    CHAT_MODEL_GPT_4_BROWSING,
    CHAT_MODEL_GPT_4_VISION,
    CHAT_MODEL_GPT_4_ALL,
    CHAT_MODEL_GPT_4O,
    CHAT_MODEL_O1,
    CHAT_MODEL_O1_MINI,
    CHAT_MODEL_O3_MINI
  ]
};

export const CHAT_MODEL_GROUP_DEEPSEEK: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_DEEPSEEK,
  name: 'deepseek',
  getDisplayName: () => i18n.global.t('chat.modelGroup.deepseek'),
  getDescription: () => i18n.global.t('chat.modelGroup.deepseekDescription'),
  models: [CHAT_MODEL_DEEPSEEK_CHAT, CHAT_MODEL_DEEPSEEK_REASONER]
};

export const CHAT_MODEL_GROUP_GROK: IChatModelGroup = {
  icon: CHAT_MODEL_ICON_GROK,
  name: 'grok',
  getDisplayName: () => i18n.global.t('chat.modelGroup.grok'),
  getDescription: () => i18n.global.t('chat.modelGroup.grokDescription'),
  models: [CHAT_MODEL_GROK_3, CHAT_MODEL_GROK_3_REASONER, CHAT_MODEL_GROK_3_DEEPSEARCH]
};

export const CHAT_MODELS: IChatModel[] = [
  CHAT_MODEL_GPT_3_5,
  CHAT_MODEL_GPT_3_5_BROWSING,
  CHAT_MODEL_GPT_4,
  CHAT_MODEL_GPT_4_BROWSING,
  CHAT_MODEL_GPT_4_VISION,
  CHAT_MODEL_GPT_4_ALL,
  CHAT_MODEL_GPT_4O,
  CHAT_MODEL_O1,
  CHAT_MODEL_O1_MINI,
  CHAT_MODEL_O3_MINI,
  CHAT_MODEL_DEEPSEEK_CHAT,
  CHAT_MODEL_DEEPSEEK_REASONER,
  CHAT_MODEL_GROK_3,
  CHAT_MODEL_GROK_3_REASONER,
  CHAT_MODEL_GROK_3_DEEPSEARCH
];
