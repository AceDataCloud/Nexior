<template>
  <el-dropdown trigger="click" @command="onSelect">
    <span class="el-dropdown-link">
      {{ currentLabel }}
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="enter">{{ $t('common.sendShortcut.enter') }}</el-dropdown-item>
        <el-dropdown-item command="mod-enter">{{
          $t('common.sendShortcut.modEnter', { key: modKey })
        }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElIcon } from 'element-plus';
import { getDomain } from '@/utils';
import { getCookie, setCookie } from 'typescript-cookie';
import { ArrowDown } from '@element-plus/icons-vue';

export default defineComponent({
  name: 'SendShortcutSelector',
  components: {
    ArrowDown,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElIcon
  },
  data() {
    // Platform-specific modifier label; guarded for SSR where navigator is absent.
    const isMac =
      typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);
    return {
      shortcut: 'enter' as 'enter' | 'mod-enter',
      modKey: isMac ? '⌘' : 'Ctrl'
    };
  },
  computed: {
    currentLabel(): string {
      return this.shortcut === 'mod-enter'
        ? (this.$t('common.sendShortcut.modEnter', { key: this.modKey }) as string)
        : (this.$t('common.sendShortcut.enter') as string);
    }
  },
  mounted() {
    this.shortcut = getCookie('SEND_SHORTCUT') === 'mod-enter' ? 'mod-enter' : 'enter';
  },
  methods: {
    onSelect(command: 'enter' | 'mod-enter') {
      this.shortcut = command;
      setCookie('SEND_SHORTCUT', command, {
        path: '/',
        domain: getDomain()
      });
    }
  }
});
</script>
