import { IChatModel } from '@/models';

export const ROLE_SYSTEM = 'system';
export const ROLE_ASSISTANT = 'assistant';
export const ROLE_USER = 'user';

export const CHAT_MODEL_NAME_GPT_3_5 = 'gpt-3.5';
export const CHAT_MODEL_NAME_GPT_3_5_BROWSING = 'gpt-3.5-browsing';
export const CHAT_MODEL_NAME_GPT_4 = 'gpt-4';
export const CHAT_MODEL_NAME_GPT_4_BROWSING = 'gpt-4-browsing';
export const CHAT_MODEL_NAME_GPT_4_VISION = 'gpt-4-vision';

export const CHAT_SERVICE_ID = 'b1fbcc32-e218-4253-9dc3-4fe600a1bfb9';

export const CHAT_MODEL_GPT_3_5: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_3_5,
  displayName: '3.5 - 标准',
  description: '3.5 标准模型，输入约 8 千汉字'
};

export const CHAT_MODEL_GPT_3_5_BROWSING: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_3_5_BROWSING,
  displayName: '3.5 - 联网',
  description: '3.5 联网模型，额外支持实时联网搜索问答'
};

export const CHAT_MODEL_GPT_4: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4,
  displayName: '4.0 - 标准',
  description: '4.0 标准模型，输入约 4 千汉字'
};

export const CHAT_MODEL_GPT_4_BROWSING: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4_BROWSING,
  displayName: '4.0 - 联网',
  description: '4.0 联网模型，支持实时联网搜索问答'
};

export const CHAT_MODEL_GPT_4_VISION: IChatModel = {
  name: CHAT_MODEL_NAME_GPT_4_VISION,
  displayName: '4.0 - 视觉',
  description: '4.0 视觉模型，支持图片输入和识别'
};
