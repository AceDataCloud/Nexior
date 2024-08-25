import i18n from '@/i18n';
import { IChatModel } from '@/models';

export const ROLE_SYSTEM = 'system';
export const ROLE_ASSISTANT = 'assistant';
export const ROLE_USER = 'user';

export const CHAT_MODEL_NAME_GPT_3_5 = 'gpt-3.5';
export const CHAT_MODEL_NAME_GPT_3_5_BROWSING = 'gpt-3.5-browsing';
export const CHAT_MODEL_NAME_GPT_4 = 'gpt-4';
export const CHAT_MODEL_NAME_GPT_4_BROWSING = 'gpt-4-browsing';
export const CHAT_MODEL_NAME_GPT_4_VISION = 'gpt-4-vision';
export const CHAT_MODEL_NAME_GPT_4_ALL = 'gpt-4-all';

export const CHAT_SERVICE_ID = 'b1fbcc32-e218-4253-9dc3-4fe600a1bfb9';

export const CHAT_MODEL_GPT_3_5: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_3_5,
  getDisplayName: () => i18n.global.t('chat.model.35Standard'),
  getDescription: () => i18n.global.t('chat.model.35StandardDescription')
};

export const CHAT_MODEL_GPT_3_5_BROWSING: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_3_5_BROWSING,
  getDisplayName: () => i18n.global.t('chat.model.35Browsing'),
  getDescription: () => i18n.global.t('chat.model.35BrowsingDescription')
};

export const CHAT_MODEL_GPT_4: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4,
  getDisplayName: () => i18n.global.t('chat.model.4Standard'),
  getDescription: () => i18n.global.t('chat.model.4StandardDescription')
};

export const CHAT_MODEL_GPT_4_BROWSING: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4_BROWSING,
  getDisplayName: () => i18n.global.t('chat.model.4Browsing'),
  getDescription: () => i18n.global.t('chat.model.4BrowsingDescription')
};

export const CHAT_MODEL_GPT_4_VISION: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4_VISION,
  getDisplayName: () => i18n.global.t('chat.model.4Vision'),
  getDescription: () => i18n.global.t('chat.model.4VisionDescription')
};

export const CHAT_MODEL_GPT_4_ALL: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4_ALL,
  getDisplayName: () => i18n.global.t('chat.model.4All'),
  getDescription: () => i18n.global.t('chat.model.4AllDescription')
};
