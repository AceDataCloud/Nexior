<template>
  <div class="text-center text-[var(--el-text-color-secondary)] py-10">
    <button
      type="button"
      class="no-tasks-btn inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--el-color-primary-light-5)] bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)] cursor-pointer transition duration-200 hover:bg-[var(--el-color-primary-light-7)] hover:scale-105 active:scale-95"
      :aria-label="$t('common.message.noTasks')"
      :title="$t('common.message.noTasks')"
      @click="onClick"
    >
      <magic-icon class="text-base" :size="'1em' as any" aria-hidden="true" focusable="false" />
    </button>
    <p class="mt-4 text-sm">{{ $t('common.message.noTasks') }}</p>
  </div>
</template>

<script lang="ts">
import { MagicIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';
import { taskDrawerState, openTaskDrawer } from '@/utils/taskDrawerMixin';

export default defineComponent({
  name: 'NoTasks',
  components: {
    MagicIcon
  },
  mounted() {
    taskDrawerState.empty = true;
  },
  beforeUnmount() {
    taskDrawerState.empty = false;
  },
  methods: {
    onClick() {
      // The drawer is a mobile-only affordance; on desktop the config panel is
      // already visible, so there is nothing to open.
      if (window.matchMedia('(max-width: 767px)').matches) {
        openTaskDrawer();
      }
    }
  }
});
</script>
