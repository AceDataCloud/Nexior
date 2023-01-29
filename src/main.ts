import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import store from './store/index';
import i18n from './i18n/index';
import './assets/scss/style.scss';
import './assets/css/tailwind.css';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';
import { vLoading } from 'element-plus';
import * as Sentry from '@sentry/vue';
import { BrowserTracing } from '@sentry/tracing';
import { getEnv } from './utils';

console.debug('start to create app');
const app = createApp(App);

Sentry.init({
  app,
  dsn: 'https://d9f92cc082b248ff9f4bea99de18483f@o191066.ingest.sentry.io/1291454',
  integrations: [
    new BrowserTracing({
      routingInstrumentation: Sentry.vueRouterInstrumentation(router),
      tracePropagationTargets: ['data.local.zhishuyun.com', 'data.test.zhishuyun.com', 'data.zhishuyun.com']
    })
  ],
  environment: getEnv(),
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0
});

app.use(router);
app.use(store);
// app.use(ElementPlus);
app.use(i18n);
app.use(dayjs, {
  formatString: 'YYYY-MM-DD HH:mm:ss'
});
app.directive('loading', vLoading);
app.mount('#app');
console.debug('app mounted');
