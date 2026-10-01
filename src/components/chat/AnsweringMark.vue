<template>
  <span v-if="loadingOptions" role="status" :aria-label="$t('common.status.loading')">
    <loading-indicator :options="loadingOptions" :stage="stage" />
  </span>
  <div v-else class="mark"></div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent, type PropType } from 'vue';
const LoadingIndicator = defineAsyncComponent(() => import('@/components/loading/LoadingIndicator.vue'));
import type { LoadingOptions } from '@/components/loading/catalog';

export default defineComponent({
  name: 'AnsweringMark',
  components: { LoadingIndicator },
  props: {
    loadingOptions: { type: Object as PropType<LoadingOptions>, default: undefined },
    stage: { type: String, default: 'waiting' }
  },
  data() {
    return {};
  },
  computed: {
    conversationId() {
      return this.$route.params?.id?.toString();
    }
  }
});
</script>

<style lang="scss">
@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.mark {
  width: 2px;
  height: 16px;
  margin-top: 3px;
  background-color: var(--el-text-color-primary);
  animation: blink 1s infinite;
}
</style>
