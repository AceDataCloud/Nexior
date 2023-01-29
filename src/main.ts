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

console.debug('start to create app');
const app = createApp(App);

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
