import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import midjourney from './midjourney';
import chat from './chat';
import root from './common';
import persistChat from './chat/persist';
import persistMidjourney from './midjourney/persist';
import persistRoot from './common/persist';

const store = createStore({
  ...root,
  modules: {
    midjourney,
    chat
  },
  plugins: [
    createPersistedState({
      paths: [...persistRoot, ...persistChat, ...persistMidjourney]
    })
  ]
});

export default store;
