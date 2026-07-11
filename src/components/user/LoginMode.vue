<template>
  <el-dropdown trigger="click" @command="onSelect">
    <span class="el-dropdown-link">
      {{ currentLabel }}
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="iframe">{{ $t('common.loginMode.iframe') }}</el-dropdown-item>
        <el-dropdown-item command="redirect">{{ $t('common.loginMode.redirect') }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { ArrowDown } from '@element-plus/icons-vue';
import { getLoginMethodPreference, setLoginMethodPreference, type LoginMethod } from '@/utils/loginMethod';

export default defineComponent({
  name: 'LoginModeSelector',
  components: {
    ArrowDown,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElIcon
  },
  data() {
    // Show the currently effective mode: an explicit choice if set, otherwise
    // the default web behaviour (redirect).
    const initial: LoginMethod = getLoginMethodPreference() ?? 'redirect';
    return {
      method: initial
    };
  },
  computed: {
    currentLabel(): string {
      return this.method === 'iframe'
        ? (this.$t('common.loginMode.iframe') as string)
        : (this.$t('common.loginMode.redirect') as string);
    }
  },
  methods: {
    onSelect(command: LoginMethod) {
      this.method = command;
      setLoginMethodPreference(command);
    }
  }
});
</script>
