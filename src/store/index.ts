import { createStore, ActionContext } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import midjourney from './midjourney';
import chat from './chat';
import root from './common';

const store = createStore({
  ...root,
  modules: {
    midjourney,
    chat
  },
  plugins: [
    createPersistedState({
      paths: [
        'token',
        'user',
        'chat.applications',
        'chat.conversations',
        'midjourney.applications',
        'midjourney.imagineTasks'
      ]
    })
  ]
});

export default store;
