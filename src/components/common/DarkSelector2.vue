<template>
  <dark-switch class="switch" dark-background="#333" light-background="#fff" />
</template>

<script lang="ts">
import { getDomain } from '@/utils';
import { getCookie, setCookie } from 'typescript-cookie';
import { defineComponent } from 'vue';
import { Switch as DarkSwitch, toggleDark, isDark } from 'vue-dark-switch';

export default defineComponent({
  components: {
    DarkSwitch
  },
  emits: ['update:dark'],
  computed: {
    dark() {
      return getCookie('THEME') === 'dark';
    },
    switchValue() {
      return isDark.value;
    }
  },
  watch: {
    switchValue(val) {
      console.log('switchValue', val);
      this.setCookie(val);
    },
    dark(val) {
      document.documentElement.classList.toggle('dark', val);
      this.setCookie(this.dark);
    }
  },
  mounted() {
    console.log('dark selector mounted');
    if (this.dark) {
      toggleDark(true);
      document.documentElement.classList.add('dark');
    } else {
      toggleDark(false);
      document.documentElement.classList.remove('dark');
    }
  },
  methods: {
    setCookie(isDark: boolean) {
      setCookie('THEME', isDark ? 'dark' : 'light', {
        path: '/',
        domain: getDomain()
      });
    }
  }
});
</script>

<style lang="scss">
.switch {
  --n-rail-color-active: var(--el-color-primary) !important;
  --n-loading-color: var(--el-color-primary) !important;
  border-radius: 10px !important;
  border: 1px solid var(--el-border-color);
  overflow: hidden;
  .n-switch__button {
    border-radius: 50% !important;
    box-shadow: none !important;
  }
}
</style>
