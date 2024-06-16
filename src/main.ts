import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import store from './store/index';
import i18n from './i18n/index';
import './assets/scss/style.scss';
import './assets/css/tailwind.css';
import 'mac-scrollbar/dist/mac-scrollbar.css';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';
import { vLoading } from 'element-plus';
import {
  initializeCookies,
  initializeDescription,
  initializeFavicon,
  initializeKeywords,
  initializeSite,
  initializeTitle
} from './utils/initializer';

const main = async () => {
  await initializeCookies();
  await initializeSite();
  await initializeTitle();
  await initializeDescription();
  await initializeKeywords();
  await initializeFavicon();

  const app = createApp(App);

  app.use(router);
  app.use(store);
  app.use(i18n);
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
