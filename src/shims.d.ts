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
declare module '*.tpl?raw' {
  const content: string;
  export default content;
}

declare module '*.vue' {
  import { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, {}>;
  export default component;
}

// Native-only IAP plugin: dynamically imported on iOS, attaches a global
// `CdvPurchase`. Declared loosely so the web/Android type-check passes
// without the native package installed.
declare module 'cordova-plugin-purchase';
declare const CdvPurchase: any;

// Injected by vite.config `define` for all surfaces (web/android/ios/desktop).
// Holds the package.json version; used for the telemetry release tag and the
// desktop version gate.
declare const __APP_VERSION__: string;

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
