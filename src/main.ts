import { createApp } from 'vue';
import App from './App.vue';
import router from './router/index';
import store from './store/index';
import ElementPlus from 'element-plus';
import i18n from './i18n/index';
import './assets/scss/style.scss';
import 'element-plus/dist/index.css';

createApp(App).use(router).use(store).use(ElementPlus).use(i18n).mount('#app');
