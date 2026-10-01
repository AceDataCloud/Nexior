import { createApp } from 'vue';
import { createStore } from 'vuex';
import { createRouter, createWebHistory } from 'vue-router';
import { MotionPlugin } from '@vueuse/motion';
import i18n, { setI18nLanguage } from '@/i18n';
import '@acedatacloud/core/styles.css';
import '@acedatacloud/core/controls.css';
import '@/assets/css/tailwind.css';
import MotionLab from './MotionLab.vue';

// Isolated review entry: no app bootstrap, credentials, service calls or billing.
await setI18nLanguage(new URLSearchParams(location.search).get('lang') === 'zh-CN' ? 'zh-CN' : 'en');
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: MotionLab }]
});
const store = createStore({ state: { site: null }, getters: { site: () => undefined } });
createApp(MotionLab).use(i18n).use(store).use(router).use(MotionPlugin).mount('#app');
