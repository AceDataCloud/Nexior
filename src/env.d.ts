/// <reference types="vite/client" />

declare module 'element-ui/*';
declare module '*.mjs';
declare module '*.md';
declare module '*.tpl' {
  const value: string;
  export default value;
}

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, {}>;
  export default component;
}

// declare config object
declare const config: any;
