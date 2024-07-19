<template>
  <el-dialog :model-value="visible" :width="200" class="text-center" @close="$emit('close')">
    <dark-switch class="switch" dark-background="#333" light-background="#fff" />
  </el-dialog>
</template>

<script lang="ts">
import { getDomain } from '@/utils';
import { getCookie, setCookie } from 'typescript-cookie';
import { defineComponent } from 'vue';
import { Switch as DarkSwitch, toggleDark, isDark } from 'vue-dark-switch';
import { ElDialog } from 'element-plus';

export default defineComponent({
  components: {
    DarkSwitch,
    ElDialog
  },
  props: {
    visible: {
      type: Boolean,
      default: true
    }
  },
  emits: ['update:dark', 'close'],
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
      this.setCookie(val);
    },
    dark(val) {
      document.documentElement.classList.toggle('dark', val);
      this.setCookie(this.dark);
    }
  },
  mounted() {
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
