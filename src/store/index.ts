import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import midjourney from './midjourney';
import chat from './chat';
import chatdoc from './chatdoc';
import root from './common';
import persistChat from './chat/persist';
import persistMidjourney from './midjourney/persist';
import persistChatdoc from './chatdoc/persist';
import persistRoot from './common/persist';

const store = createStore({
  ...root,
  modules: {
    midjourney,
    chat,
    chatdoc
  },
  plugins: [
    createPersistedState({
      paths: [...persistRoot, ...persistChat, ...persistMidjourney, ...persistChatdoc]
    })
  ]
});

export default store;
