import dayjs from 'dayjs';
import { App } from 'vue';

export interface IDayJS {
  format: (v: string | undefined, formatString?: string) => string;
}

interface IOptions {
  formatString: string;
}

export default {
  install: (app: App, options: IOptions) => {
    app.config.globalProperties.$dayjs = {
      format(v: string, formatString: string = '') {
        return dayjs(v).format(formatString || options.formatString);
      }
    };
  }
};

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $dayjs: IDayJS;
  }
}
