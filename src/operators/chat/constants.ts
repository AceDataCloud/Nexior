import { IChatModel } from './models';

export const CHAT_MODEL_NAME_CHATGPT = 'chatgpt';
export const CHAT_MODEL_NAME_CHATGPT4 = 'chatgpt4';
export const CHAT_MODEL_NAME_CHATGPT_16K = 'chatgpt-16k';
export const CHAT_MODEL_NAME_CHATGPT_BROWSING = 'chatgpt-browsing';
export const CHAT_MODEL_NAME_CHATGPT4_BROWSING = 'chatgpt4-browsing';
export const CHAT_MODEL_NAME_CHATGPT4_VISION = 'chatgpt4-vision';

export const API_ID_CHATGPT = '1d58971c-e3cd-4713-a3ce-854a731adb14';
export const API_ID_CHATGPT_16K = 'bf93bb28-55a7-4428-ad82-156bf410f4e2';
export const API_ID_CHATGPT_BROWSING = '12271e2e-794f-4079-a714-f68dd0df7808';
export const API_ID_CHATGPT4 = '1c4e8fa3-362b-4e0a-b0fd-9ff9fc173b77';
export const API_ID_CHATGPT4_BROWSING = 'a61de51b-d0d0-48a2-9a17-1d4986d5d497';
export const API_ID_CHATGPT4_VISION = '098c6e4a-14ae-4ff1-8d2f-0968532a4638';

export const CHAT_MODEL_CHATGPT: IChatModel = {
  apiId: API_ID_CHATGPT,
  name: CHAT_MODEL_NAME_CHATGPT,
  displayName: '3.5 - 标准',
  description: '3.5 标准模型，输入约 2 千汉字'
};

export const CHAT_MODEL_CHATGPT_16K: IChatModel = {
  apiId: API_ID_CHATGPT_16K,
  name: CHAT_MODEL_NAME_CHATGPT_16K,
  displayName: '3.5 - 16K',
  description: '3.5 16K 模型，输入约 8 千汉字'
};

export const CHAT_MODEL_CHATGPT_BROWSING: IChatModel = {
  apiId: API_ID_CHATGPT_BROWSING,
  name: CHAT_MODEL_NAME_CHATGPT_BROWSING,
  displayName: '3.5 - 联网',
  description: '3.5 联网模型，额外支持实时联网搜索问答'
};

export const CHAT_MODEL_CHATGPT4: IChatModel = {
  apiId: API_ID_CHATGPT4,
  name: CHAT_MODEL_NAME_CHATGPT4,
  displayName: '4.0 - 标准',
  description: '4.0 标准模型，输入约 4 千汉字'
};

export const CHAT_MODEL_CHATGPT4_BROWSING: IChatModel = {
  apiId: API_ID_CHATGPT4_BROWSING,
  name: CHAT_MODEL_NAME_CHATGPT4_BROWSING,
  displayName: '4.0 - 联网',
  description: '4.0 联网模型，支持实时联网搜索问答'
};

export const CHAT_MODEL_CHATGPT4_VISION: IChatModel = {
  apiId: API_ID_CHATGPT4_VISION,
  name: CHAT_MODEL_NAME_CHATGPT4_VISION,
  displayName: '4.0 - 视觉',
  description: '4.0 视觉模型，支持图片输入和识别'
};
