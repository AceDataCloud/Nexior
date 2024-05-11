<template>
  <el-button :class="{ active: !!dark }" @click="setDark(!dark)">
    <font-awesome-icon v-if="dark" icon="fa-solid fa-moon" />
    <font-awesome-icon v-else icon="fa-solid fa-moon" />
  </el-button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { toggleDark } from 'vue-dark-switch';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { ElButton } from 'element-plus';
import { getCookie, setCookie } from 'typescript-cookie';
import { getDomain } from '@/utils/initializer';

export default defineComponent({
  components: {
    FontAwesomeIcon,
    ElButton
  },
  emits: ['update:dark'],
  computed: {
    dark() {
      return getCookie('THEME') === 'dark';
    }
  },
  watch: {
    dark(val) {
      this.setDark(val);
    }
  },
  mounted() {
    console.log('mounted', this.dark);
    this.setDark(this.dark);
  },
  methods: {
    setDark(flag: boolean) {
      toggleDark(flag);
      this.setCookie(flag);
      if (flag === true) {
        document.documentElement.classList.add('dark');
      } else if (flag === false) {
        document.documentElement.classList.remove('dark');
      }
    },
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
  margin-top: 2px;
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
