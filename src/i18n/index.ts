import enLang from './en/index';
import zhLang from './zh/index';
import enLocale from 'element-plus/lib/locale/lang/en';
import zhLocale from 'element-plus/lib/locale/lang/zh-cn';
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  locale: zhLocale.name,
  fallbackLocale: enLocale.name,
  messages: {
    [enLocale.name]: {
      el: enLocale.el,
      ...enLang
    },
    [zhLocale.name]: {
      el: zhLocale.el,
      ...zhLang
    }
  }
});

export const t = i18n.global.t;
export default i18n;
