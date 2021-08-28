<template>
  <breadcrumb />
  <div id="vditor" class="vditor" />
</template>

<script lang="ts">
import Vditor from 'vditor';
import { Breadcrumb } from '@/components/common/index';
import { defaultOptions } from '@/settings/editor';
import 'vditor/src/assets/scss/index.scss';

export default {
  components: {
    Breadcrumb
  },
  data() {
    return {
      vditor: null
    };
  },
  mounted() {
    this.initVditor();
  },
  computed: {},
  methods: {
    initVditor() {
      const options = {
        width: this.isMobile ? '100%' : '80%',
        height: '0',
        tab: '\t',
        mode: 'ir',
        icon: 'material',
        debugger: false,
        after: () => {
          this.vditor.setValue('');
        }
      };
      this.vditor = new Vditor('vditor', {
        ...defaultOptions,
        ...options
      });
      // this.vditor.focus();
    }
  }
};
</script>

<style lang="scss">
.vditor {
  margin: 50px auto;
  height: calc(100vh - 200px);
}
</style>
