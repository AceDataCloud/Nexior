<template>
  <el-dropdown trigger="click" @command="onSelect">
    <span class="el-dropdown-link">
      {{ currentLabel }}
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="light">{{ $t('common.theme.light') }}</el-dropdown-item>
        <el-dropdown-item command="dark">{{ $t('common.theme.dark') }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { getDomain } from '@/utils';
import { setCookie } from 'typescript-cookie';
import { ArrowDown } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'ThemeSelector',
  components: {
    ArrowDown,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElIcon
  },
  data() {
    return {
      theme: 'light' as 'light' | 'dark'
    };
  },
  computed: {
    currentLabel(): string {
      return this.theme === 'dark'
        ? (this.$t('common.theme.dark') as string)
        : (this.$t('common.theme.light') as string);
    }
  },
  mounted() {
    // Mirror the theme already applied at startup by `initializeTheme`
    // (cookie-or-dark) via the live <html> class. Re-deriving from the
    // cookie here used a different default ('light') and stricter parse,
    // so a missing/non-canonical cookie flipped the theme on Settings open.
    this.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  },
  methods: {
    onSelect(command: 'light' | 'dark') {
      this.theme = command;
      this.applyTheme();
    },
    applyTheme() {
      setCookie('THEME', this.theme, {
        path: '/',
        domain: getDomain()
      });
      if (this.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }
});
</script>
