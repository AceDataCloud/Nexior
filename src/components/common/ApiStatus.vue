<template>
  <span v-if="application && !initializing" class="info">
    {{ $t('conversation.message.usedCount') }}: {{ application?.used_amount }}
    {{ $t('conversation.message.remainingCount') }}: {{ application?.remaining_amount }}
  </span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { IApplication } from '@/operators';
import { ElSkeleton } from 'element-plus';

export default defineComponent({
  name: 'ApiStatus',
  components: {
    ElSkeleton
  },
  props: {
    application: {
      type: Object as () => IApplication,
      required: true
    },
    initializing: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {};
  },
  computed: {},
  methods: {}
});
</script>

<style lang="scss">
.info {
  font-size: 14px;
  color: var(--el-color-black);
}
</style>
