<template>
  <div class="flex items-center gap-2 text-sm text-[var(--app-text-subtle)] py-1" role="status">
    <loading-icon class="adc-icon-spin text-[var(--el-color-primary)]" :size="'1em' as any" aria-hidden="true" />
    <span>{{ $t('codingBridge.session.working') }}</span>
    <span class="tabular-nums opacity-60">({{ elapsed }}s)</span>
  </div>
</template>

<script lang="ts">
import { LoadingIcon } from '@acedatacloud/core/icons/components';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'CodingBridgeThinkingIndicator',
  components: { LoadingIcon },
  data() {
    return { elapsed: 0, timer: 0 };
  },
  mounted() {
    this.timer = window.setInterval(() => {
      this.elapsed += 1;
    }, 1000);
  },
  beforeUnmount() {
    window.clearInterval(this.timer);
  }
});
</script>
