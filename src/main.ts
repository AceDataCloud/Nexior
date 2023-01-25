import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import store from './store/index';
import ElementPlus from 'element-plus';
import i18n from './i18n/index';
import './assets/css/tailwind.css';
import './assets/scss/style.scss';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';

const app = createApp(App);

const env = import.meta.env.VITE_APP_ENV;
console.log('env', env);
app.use(router);
app.use(store);
app.use(ElementPlus);
app.use(i18n);
app.use(dayjs, {
  formatString: 'YYYY-MM-DD HH:mm:ss'
});
app.mount('#app');
