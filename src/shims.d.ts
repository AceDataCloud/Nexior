/// <reference types="vite/client" />
/// <reference types="vue" />
/// <reference types="vue-router" />
/// <reference types="vue-i18n" />
/// <reference types="element-plus/global" />

import { ComponentCustomProperties } from 'vue';
import { Router } from 'vue-router';
import { I18n, VueI18n } from 'vue-i18n';
import { Store } from 'vuex';
import { IRootState } from './store/common/models';
import type { Router, RouteLocationNormalizedLoaded } from 'vue-router';

declare module '*.mjs';
declare module '*.md';
declare module '*.ico';
declare module '*.css';
declare module '*.scss';
declare module '*.png';
declare module '*.tpl';

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, {}>;
  export default component;
}

// declare namespace Intl {
//   function getCanonicalLocales(locales: string | string[] | undefined): string[];
// }

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $t: VueI18n['t'];
    $i18n: VueI18n;
    $store: Store<IRootState>;
    $router: Router;
    $route: RouteLocationNormalizedLoaded;
  }
}
