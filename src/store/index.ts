import { createStore, ActionContext } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import { common } from './common';
import { midjourney } from './midjourney';
import { chat } from './chat';

const store = createStore({
  modules: {
    common,
    midjourney,
    chat
  },
  plugins: [createPersistedState()]
});

export default store;
