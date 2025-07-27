/// <reference types="vite/client" />
/// <reference types="vue" />
/// <reference types="vue-router" />
/// <reference types="vue-i18n" />
/// <reference types="element-plus/global" />

import { ComponentCustomProperties } from 'vue';
import { Router } from 'vue-router';
import { I18n } from 'vue-i18n';
import { Store } from 'vuex';
import { IRootState } from './store/common/models';
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router';

declare module '*.mjs';
declare module '*.md';
declare module '*.ico';
declare module '*.css';
declare module '*.scss';
declare module '*.png';
declare module '*.tpl' {
  const value: string;
  export default value;
}

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, {}>;
  export default component;
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: (key: string, ...args: unknown[]) => string;
    $store: Store<IRootState>;
    $router: Router;
    $route: RouteLocationNormalizedLoaded;
  }
}
