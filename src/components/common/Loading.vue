<template>
  <full-loading
    v-model:active="showing"
    color="#409eff"
    loader="bars"
    :opacity="0.8"
    :can-cancel="true"
    :on-cancel="undefined"
    :is-full-page="true"
  />
</template>

<script lang="ts">
import FullLoading from 'vue-loading-overlay';
import 'vue-loading-overlay/dist/vue-loading.css';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Loading',
  components: {
    FullLoading
  },
  data() {
    return {
      showing: false
    };
  },
  props: {
    loading: {
      type: Boolean,
      default: false
    },
    delay: {
      type: Number,
      default: 200
    }
  },
  watch: {
    loading: {
      handler(val, oldVal) {
        if (oldVal === true && val === false) {
          setTimeout(() => {
            this.showing = val;
          }, this.delay);
        } else {
          this.showing = val;
        }
      }
    }
  }
});
</script>
