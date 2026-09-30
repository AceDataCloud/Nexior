<template>
  <el-popover
    v-model:visible="visible"
    trigger="hover"
    placement="right-start"
    :width="288"
    :offset="0"
    :show-arrow="false"
    :show-after="100"
    :hide-after="180"
    :popper-options="{
      modifiers: [{ name: 'flip', options: { fallbackPlacements: ['left-start', 'top', 'bottom'] } }]
    }"
    popper-class="account-switcher-popover"
    @after-enter="focusFirstIfRequested"
  >
    <template #reference>
      <button
        ref="trigger"
        class="account-switcher-trigger"
        type="button"
        aria-haspopup="menu"
        :aria-expanded="visible"
        :aria-label="$t('common.account.switch')"
        @click="visible = !visible"
        @keydown.right.prevent="openWithKeyboard"
        @keydown.down.prevent="openWithKeyboard"
        @keydown.esc.stop.prevent="visible = false"
      >
        <span class="min-w-0 truncate">{{
          user.email || user.nickname || user.username || $t('common.account.switch')
        }}</span>
        <chevron-right :size="16" class="account-switcher-chevron" aria-hidden="true" />
      </button>
    </template>
    <div ref="menu" role="menu" :aria-label="$t('common.account.switch')" :aria-busy="busy" @keydown="onMenuKeydown">
      <div class="account-switcher-heading">{{ $t('common.account.switch') }}</div>
      <div class="account-switcher-list">
        <button
          v-for="account in accounts"
          :key="account.user.id"
          type="button"
          class="account-switcher-row"
          role="menuitemradio"
          :aria-checked="account.user.id === user.id"
          :disabled="busy"
          @click="select(account.user.id!)"
        >
          <img :src="account.user.avatar || defaultAvatar" alt="" class="account-switcher-avatar" />
          <span class="account-switcher-identity">
            <span class="account-switcher-name">{{
              account.user.nickname || account.user.username || account.user.email
            }}</span>
            <span
              v-if="account.user.email && (account.user.nickname || account.user.username)"
              class="account-switcher-email"
              >{{ account.user.email }}</span
            >
          </span>
          <check v-if="account.user.id === user.id" :size="16" class="shrink-0" aria-hidden="true" />
        </button>
      </div>
      <div class="account-switcher-divider" />
      <button type="button" class="account-switcher-row" role="menuitem" :disabled="busy" @click="add">
        <span class="account-switcher-add"><plus :size="18" aria-hidden="true" /></span>
        <span>{{ $t('common.account.add') }}</span>
      </button>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { t } from '@/i18n';
import { ElMessage, ElPopover } from 'element-plus';
import { Check, ChevronRight, Plus } from '@lucide/vue';
import axios from 'axios';
import defaultAvatar from '@/assets/images/avatar.png';
import { rememberAccount } from '@/utils/auth/accountSessions';
import type { IRootState } from '@/store/common/models';

const props = defineProps<{ parentVisible: boolean }>();
const store = useStore<IRootState>();
const emit = defineEmits<{ close: [] }>();
const visible = ref(false);
const busy = ref(false);
const menu = ref<HTMLElement>();
const trigger = ref<HTMLButtonElement>();
watch(
  () => props.parentVisible,
  (open) => {
    if (!open) visible.value = false;
  }
);
const keyboardRequested = ref(false);
const user = computed(() => store.state.user || {});
const accounts = computed(() => rememberAccount(store.state.accounts || [], user.value, store.state.token));

function close() {
  visible.value = false;
  emit('close');
}

async function add() {
  if (busy.value) return;
  close();
  try {
    await store.dispatch('addAccount');
  } catch {
    ElMessage.error(t('common.account.switchFailed'));
  }
}

async function select(id: string) {
  if (busy.value) return;
  if (id === user.value.id) {
    close();
    return;
  }
  busy.value = true;
  try {
    await store.dispatch('switchAccount', id);
    close();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      ElMessage.warning(t('common.account.expired'));
      busy.value = false;
      await add();
    } else {
      ElMessage.error(t('common.account.switchFailed'));
    }
  } finally {
    busy.value = false;
  }
}

function openWithKeyboard() {
  keyboardRequested.value = true;
  visible.value = true;
  void nextTick(focusFirstIfRequested);
}

function focusFirstIfRequested() {
  if (!keyboardRequested.value || !menu.value) return;
  menu.value.querySelector<HTMLButtonElement>('button')?.focus();
  keyboardRequested.value = false;
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' || event.key === 'ArrowLeft') {
    event.preventDefault();
    event.stopPropagation();
    visible.value = false;
    trigger.value?.focus();
    return;
  }
  const buttons = Array.from(menu.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') || []);
  const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const next = event.key === 'ArrowDown' ? index + 1 : event.key === 'ArrowUp' ? index - 1 : undefined;
  if (next !== undefined && buttons.length) {
    event.preventDefault();
    event.stopPropagation();
    buttons[(next + buttons.length) % buttons.length].focus();
  }
}
</script>

<style lang="scss">
.account-switcher-popover.el-popover {
  padding: 6px;
  max-width: calc(100vw - 24px);
  border-radius: 14px;
}
</style>

<style lang="scss" scoped>
.account-switcher-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: 100%;
  max-width: min(320px, calc(100vw - 32px));
  padding: 16px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  &:hover,
  &:focus-visible,
  &[aria-expanded='true'] {
    background: var(--el-fill-color-light);
  }
}
.account-switcher-chevron {
  flex-shrink: 0;
  opacity: 0.45;
}
.account-switcher-trigger:hover .account-switcher-chevron,
.account-switcher-trigger[aria-expanded='true'] .account-switcher-chevron {
  opacity: 1;
}
.account-switcher-heading {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.account-switcher-list {
  max-height: 280px;
  overflow-y: auto;
}
.account-switcher-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px;
  border: 0;
  border-radius: 9px;
  color: var(--el-text-color-primary);
  background: transparent;
  text-align: left;
  font-size: 14px;
  cursor: pointer;
  &:hover,
  &:focus-visible {
    background: var(--el-fill-color-light);
  }
  &:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -2px;
  }
  &:disabled {
    opacity: 0.55;
    cursor: wait;
  }
}
.account-switcher-avatar,
.account-switcher-add {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
}
.account-switcher-add {
  display: grid;
  place-items: center;
  background: var(--el-fill-color-light);
}
.account-switcher-identity {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}
.account-switcher-name,
.account-switcher-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.account-switcher-name {
  font-weight: 500;
}
.account-switcher-email {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.account-switcher-divider {
  margin: 5px 4px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
