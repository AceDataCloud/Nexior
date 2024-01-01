import { Store } from 'vuex';
import { IRootState } from './store/common/models';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: Store<IRootState>;
  }
}
