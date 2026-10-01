import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import { createStore } from 'vuex';
import { MotionPlugin } from '@vueuse/motion';
import i18n, { setI18nLanguage } from '@/i18n';
import '@acedatacloud/core/styles.css';
import '@acedatacloud/core/controls.css';
import '@/assets/css/tailwind.css';
import App from './App.vue';

await setI18nLanguage(new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'zh-CN');
const router = createRouter({ history: createWebHistory(), routes: [{ path: '/:pathMatch(.*)*', component: App }] });
const store = createStore({ state: { site: null }, getters: { site: () => undefined } });
createApp(App).use(i18n).use(store).use(router).use(MotionPlugin).mount('#app');
