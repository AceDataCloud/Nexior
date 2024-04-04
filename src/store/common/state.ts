import { IRootState } from './models';
import chatState from '../chat/state';
import midjourneyState from '../midjourney/state';
import chatdocState from '../chatdoc/state';
import { getLocale } from '@/i18n';

export default (): IRootState => {
  return {
    user: {},
    locale: getLocale(),
    dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    token: {
      access: undefined,
      refresh: undefined,
      expiration: undefined
    },
    setting: {
      // if PC, set default to true, else false
      navigationCollapsed: window.innerWidth < 768
    },
    chatdoc: chatdocState(),
    chat: chatState(),
    midjourney: midjourneyState()
  };
};
