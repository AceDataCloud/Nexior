import config from '@/config';
import { App } from 'vue';

export default {
  install: (app: App) => {
    app.config.globalProperties.$config = config;
  }
};

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $config: typeof config;
  }
}
