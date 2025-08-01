import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import i18n from './i18n';
import './assets/scss/style.scss';
import './assets/css/tailwind.css';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';
import { MotionPlugin } from '@vueuse/motion';
import { vLoading } from 'element-plus';
import {
  initializeCookies,
  initializeDescription,
  initializeFavicon,
  initializeTheme,
  initializeToken,
  initializeUser,
  initializeKeywords,
  initializeSite,
  initializeTitle,
  initializeCurrency,
  initializeExchangeRate,
  initializeRedirect,
  initializeFingerprint
} from './utils/initializer';

const main = async () => {
  // async and need to await
  await initializeRedirect();
  await initializeCookies();
  await initializeToken();
  await initializeUser();
  await initializeSite();

  // non-async and no need to await
  initializeCurrency();
  initializeTheme();
  initializeExchangeRate();
  initializeTitle();
  initializeDescription();
  initializeKeywords();
  initializeFavicon();
  initializeFingerprint();

  const app = createApp(App);

  app.use(router);
  app.use(store);
  app.use(i18n);
  app.use(MotionPlugin);
  app.use(dayjs, {
    formatString: 'YYYY-MM-DD HH:mm:ss'
  });
  app.directive('loading', vLoading);
  app.mount('#app');
  console.debug('app mounted');

  // make app available globally
  // @ts-ignore
  window.app = app;
};

main();
