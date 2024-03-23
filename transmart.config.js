module.exports = {
  baseLocale: 'en',
  locales: [
    'en',
    'de',
    'pt',
    'es',
    'fr',
    'zh-CN',
    'zh-TW',
    'it',
    'ko',
    'ja',
    'ru',
    'pl',
    'fi',
    'sv',
    'el',
    'uk',
    'ar',
    'sr'
  ],
  localePath: 'src/i18n',
  openAIApiKey: process.env.VITE_OPENAI_API_KEY,
  openAIApiModel: 'gpt-3.5-turbo-0125',
  openAIApiUrl: 'https://api.acedata.cloud',
  openAIApiUrlPath: '/openai/chat/completions',
  modelContextLimit: 16385
};
