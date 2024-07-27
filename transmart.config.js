module.exports = {
  baseLocale: 'zh-CN',
  locales: ['en', 'de', 'pt', 'es', 'fr', 'zh-TW', 'it', 'ko', 'ja', 'ru', 'pl', 'fi', 'sv', 'el', 'uk', 'ar', 'sr'],
  cacheEnabled: true,
  localePath: 'src/i18n',
  openAIApiKey: process.env.VITE_OPENAI_API_KEY,
  openAIApiModel: 'gpt-4o-mini',
  openAIApiUrl: 'https://api.acedata.cloud',
  openAIApiUrlPath: '/openai/chat/completions',
  modelContextLimit: 3000,
  additionalReqBodyParams: {
    // response_format: {
    //   type: 'json_object'
    // }
  },
  systemPromptTemplate: ({ languageName, context }) => {
    return (
      `Translate the i18n JSON file to ${languageName} according to the BCP 47 standard` +
      (context ? `\nHere are some contexts to help with better translation.  ---${context}---` : '') +
      `\n Keep the keys the same as the original file and make sure the output remains a valid i18n JSON file.` +
      `For every key, there will be sub-key named as 'message' and 'description', 'message' is the real value, 'description' is comment for the value. You must translate according to the description.` +
      `For example,` +
      `'''{
        "relax": {
          "message": "Relax",
          "description": "Text in button, which allows user to set the 'slow speed' mode to relax to generate the image, must translate to 'Slow speed'"
        }
      }'''` +
      ` should be translated to ` +
      `'''{
        "relax": {
          "message": "慢速",
          "description": "按钮文本，允许用户设置为放松模式生成图像，必须翻译为'慢速'"
        }
      }'''
      `
    );
  }
};
