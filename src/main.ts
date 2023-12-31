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
import hl from 'highlight.js';
import 'highlight.js/styles/night-owl.css';
import copyToClipboard from 'copy-to-clipboard';
import ElementPlus from 'element-plus';

console.debug('start to create app');
const app = createApp(App);

app.use(router);
app.use(store);
app.use(i18n);
app.use(ElementPlus);
app.use(dayjs, {
  formatString: 'YYYY-MM-DD HH:mm:ss'
});
app.directive('loading', vLoading);
app.mount('#app');
console.debug('app mounted');

app.directive('highlight', (el) => {
  const blocks = el.querySelectorAll('pre code');
  blocks.forEach((block: HTMLPreElement) => {
    // create the copy button
    const copy = document.createElement('button');
    copy.innerHTML = i18n.global.t('common.button.copy').toString();
    // add the event listener to each click
    copy.addEventListener('click', () => {
      copyToClipboard(block.innerText);
    });
    // append the copy button to each code block
    block.parentElement?.prepend(copy);
    hl.highlightBlock(block);
  });
});
