<template>
  <div class="text-center text-[var(--el-text-color-secondary)] py-16">
    <button
      type="button"
      class="no-tasks-btn inline-flex items-center justify-center w-16 h-16 rounded-full border border-[var(--el-color-primary-light-5)] bg-[var(--el-color-primary-light-9)] text-[var(--el-color-primary)] cursor-pointer transition duration-200 hover:bg-[var(--el-color-primary-light-7)] hover:scale-105 active:scale-95"
      :aria-label="$t('common.message.noTasks')"
      @click="onClick"
    >
      <font-awesome-icon icon="fa-solid fa-magic" class="text-2xl" />
    </button>
    <p class="mt-4 text-sm">{{ $t('common.message.noTasks') }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { taskDrawerState, openTaskDrawer } from '@/utils/taskDrawerMixin';

export default defineComponent({
  name: 'NoTasks',
  components: {
    FontAwesomeIcon
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
