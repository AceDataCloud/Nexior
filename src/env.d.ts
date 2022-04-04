/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, {}>;
  export default component;
}

declare module 'vue-plyr';
