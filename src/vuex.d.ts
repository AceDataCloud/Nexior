import { Store } from 'vuex';
import { IState } from './store/models';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<IState>;
  }
}
