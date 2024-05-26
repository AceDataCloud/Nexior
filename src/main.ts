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
import { initializeCookies, initializeFavicon, initializeTitle } from './utils/initializer';
import config from './plugins/config';

const main = async () => {
  await initializeCookies();
  await initializeTitle();
  await initializeFavicon();

  const app = createApp(App);

  app.use(router);
  app.use(store);
  app.use(i18n);
  app.use(dayjs, {
    formatString: 'YYYY-MM-DD HH:mm:ss'
  });
  app.use(config);
  app.directive('loading', vLoading);
  app.mount('#app');
  console.debug('app mounted');

  // make app available globally
  // @ts-ignore
  window.app = app;
};

main();
