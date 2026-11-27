<template>
  <el-dropdown trigger="click" @command="onSelect">
    <button type="button" class="el-dropdown-link" :aria-label="$t('common.settings.theme')">
      {{ currentLabel }}
      <el-icon class="el-icon--right"><arrow-down :size="'1em' as any" aria-hidden="true" focusable="false" /></el-icon>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="light">{{ $t('common.theme.light') }}</el-dropdown-item>
        <el-dropdown-item command="dark">{{ $t('common.theme.dark') }}</el-dropdown-item>
        <el-dropdown-item command="system">{{ $t('common.theme.system') }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts">
import { ExpandDownIcon as ArrowDown } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { getDomain } from '@/utils';
import { activeThemePreference, applyThemePreference, STUDIO_THEME_COOKIE } from '@/utils/theme';
import { setCookie } from 'typescript-cookie';

export default defineComponent({
  name: 'ThemeSelector',
  components: {
    ArrowDown,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElIcon
  },
  computed: {
    currentLabel(): string {
      if (activeThemePreference.value === 'dark') {
        return this.$t('common.theme.dark') as string;
      }
      if (activeThemePreference.value === 'system') {
        return this.$t('common.theme.system') as string;
      }
      return this.$t('common.theme.light') as string;
    }
  },
  methods: {
    onSelect(command: 'light' | 'dark' | 'system') {
      setCookie(STUDIO_THEME_COOKIE, command, { path: '/' });
      setCookie('THEME', command, { path: '/', domain: getDomain() });
      applyThemePreference(command);
    }
  }
});
</script>
