import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import store from './store/index';
import ElementPlus from 'element-plus';
import i18n from './i18n/index';
import './assets/scss/style.scss';
import './assets/css/tailwind.css';
import dayjs from './plugins/dayjs';
import './plugins/font-awesome';

const app = createApp(App);

app.use(router);
app.use(store);
app.use(ElementPlus);
app.use(i18n);
app.use(dayjs, {
  formatString: 'YYYY-MM-DD HH:mm:ss'
});
// app.mixin(constants);
app.mount('#app');
